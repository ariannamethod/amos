/* AMOS — Arianna Method Ontological Subjectivity. Dedicated to Amos Oz.
 * One world, one recurrent subject, no pretrained parameters.
 * cc -O2 -std=c99 -Wall -Wextra amos.c -lm -o amos
 * Define AMOS_NO_MAIN to include this file in an experiment.
 */
#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>
#include <inttypes.h>
#include <string.h>
#include <math.h>
#include <float.h>
#include <errno.h>

enum { AMOS_H = 24, AMOS_F = 54, AMOS_MEMORY = 128 };
enum { AMOS_NORMAL = 0, AMOS_MEMORYLESS = 1, AMOS_LINEAR = 2 };
enum { AMOS_G = 8, AMOS_L = 4, AMOS_K = AMOS_G * AMOS_L, AMOS_E = 64 };
enum { GLYPH_SEQUENCE = 1, GLYPH_BAG = 2, GLYPH_NEURAL_ONLY = 3, GLYPH_EVENTS = 4 };

typedef struct {
    double key[AMOS_K], mean[3], variance[3], mass, action;
    uint64_t age;
} Association;

typedef struct {
    int enabled, learning, anchored, count, used;
    double anchor[2], prototypes[AMOS_G][AMOS_H], sequence[AMOS_K], familiarity[AMOS_L];
    Association evidence[AMOS_E];
    uint64_t clock, duration[AMOS_L];
} Glyphs;

typedef struct { double similarity, support, uncertainty; } Recognition;

typedef struct { double x[3]; } Observation;

/* Competing predictions of the same internal consequence, not a body label. */
typedef struct {
    double weights[2][3], covariance[2][3][3], error[2];
    uint64_t samples;
} Embodiment;

typedef struct {
    double pos[2], velocity[2], load, target, polarity;
    int controlled;                  /* private world fact, never an input */
    uint64_t rng, tick;
    int kind, order;
    double gain, offset[2], jitter, cue_noise[2];
} World;

typedef struct {
    double h[AMOS_H], win[AMOS_H][5], recurrent[AMOS_H][AMOS_H];
    double weights[3][AMOS_F], covariance[AMOS_F][AMOS_F];
    double previous_action;
    Observation observation;
    int mode;
    uint64_t rng, updates;
    Glyphs glyph;
    Embodiment body;
} Subject;

typedef struct {
    uint64_t tick;                   /* completed transition, starting at 1 */
    Observation observation, next;
    double action, predicted[3], influence[2], features[AMOS_F];
    double sequence[AMOS_K];
    Recognition recognition;
} Transition;

typedef struct {
    uint64_t seed, birth;            /* immutable origin ID, NOT wall time */
    World world;
    Subject subject;
    Transition memory[AMOS_MEMORY];
    unsigned memory_start, memory_count;
} Snapshot;

static int snapshot_valid(const Snapshot *s);

static uint64_t mix64(uint64_t x)
{
    x += UINT64_C(0x9e3779b97f4a7c15);
    x = (x ^ (x >> 30)) * UINT64_C(0xbf58476d1ce4e5b9);
    x = (x ^ (x >> 27)) * UINT64_C(0x94d049bb133111eb);
    return x ^ (x >> 31);
}

static uint64_t random64(uint64_t *state)
{
    uint64_t x = *state;
    x ^= x >> 12; x ^= x << 25; x ^= x >> 27;
    *state = x;
    return x * UINT64_C(0x2545f4914f6cdd1d);
}

static double uniform(uint64_t *state)
{
    return (double)(random64(state) >> 11) * 0x1p-53;
}

static double signed_uniform(uint64_t *state)
{
    return 2.0 * uniform(state) - 1.0;
}

static double clip(double x, double lo, double hi)
{
    return x < lo ? lo : (x > hi ? hi : x);
}

/* The alphabet is acquired from neural signatures, not named by the world.
 * Stable prototypes make old sequence coordinates meaningful after replay. */
static void glyph_observe(Glyphs *g, const double signature[AMOS_H])
{
    double distance[AMOS_G], best = HUGE_VAL, sum = 0.;
    int i, j;
    for (i = 0; i < g->count; ++i) {
        distance[i] = 0.;
        for (j = 0; j < AMOS_H; ++j) {
            double d = signature[j] - g->prototypes[i][j];
            distance[i] += d*d / AMOS_H;
        }
        if (distance[i] < best) best = distance[i];
    }
    if (g->learning && g->count < AMOS_G && best > .025) {
        i = g->count++;
        memcpy(g->prototypes[i], signature, sizeof g->prototypes[i]);
        distance[i] = best = 0.;
    }
    {
        double mixture[AMOS_G] = {0.};
        int winner = 0, previous = 0, repeat = 0;
        for (i = 0; i < g->count; ++i) {
            mixture[i] = exp(-(distance[i] - best) / .008); sum += mixture[i];
        }
        if (sum > 0.) for (i = 0; i < g->count; ++i) mixture[i] /= sum;
        for (i = 1; i < AMOS_G; ++i) {
            if (mixture[i] > mixture[winner]) winner = i;
            if (g->sequence[AMOS_K-AMOS_G+i] > g->sequence[AMOS_K-AMOS_G+previous]) previous = i;
        }
        /* Repeated sightings refine the latest event without evicting history.
         * Unfamiliar observations cannot impersonate a familiar event. */
        repeat = g->enabled == GLYPH_EVENTS && g->duration[AMOS_L-1] &&
            best <= .025 && winner == previous;
        if (!repeat) {
            memmove(g->sequence, g->sequence + AMOS_G, (AMOS_K-AMOS_G)*sizeof(double));
            memmove(g->familiarity, g->familiarity+1, (AMOS_L-1)*sizeof(double));
            memmove(g->duration, g->duration+1, (AMOS_L-1)*sizeof(uint64_t));
            g->duration[AMOS_L-1] = 0;
        }
        if (g->duration[AMOS_L-1] < UINT64_MAX) ++g->duration[AMOS_L-1];
        g->familiarity[AMOS_L - 1] = exp(-best / .025);
        memcpy(g->sequence+AMOS_K-AMOS_G, mixture, sizeof mixture);
    }
}

static double glyph_similarity(const double *a, const double *b, int mode)
{
    double d = 0.; int i, t;
    if (mode == GLYPH_BAG) {
        for (i = 0; i < AMOS_G; ++i) {
            double x = 0.;
            for (t = 0; t < AMOS_L; ++t) x += a[t*AMOS_G+i] - b[t*AMOS_G+i];
            d += x*x / (AMOS_L * AMOS_L);
        }
    } else for (i = 0; i < AMOS_K; ++i) {
        double x = a[i] - b[i]; d += x*x / AMOS_L;
    }
    return exp(-d / .08);
}

static Recognition glyph_predict(const Glyphs *g, double action, double delta[3])
{
    Recognition r = {0., 0., 1.};
    double weights[AMOS_E], variance = 0., familiarity = 1.; int i, k;
    for (i = 0; i < AMOS_L; ++i) familiarity *= g->familiarity[i];
    familiarity = sqrt(sqrt(familiarity));
    memset(delta, 0, 3 * sizeof(double));
    for (i = 0; i < g->used; ++i) {
        const Association *e = &g->evidence[i];
        double match = familiarity * glyph_similarity(g->sequence, e->key, g->enabled);
        if (fabs(e->action - action) > .25) match = 0.;
        if (match > r.similarity) r.similarity = match;
        weights[i] = match * e->mass; r.support += weights[i];
        for (k = 0; k < 3; ++k) delta[k] += weights[i] * e->mean[k];
    }
    if (r.support > 1e-12) {
        for (k = 0; k < 3; ++k) delta[k] /= r.support;
        for (i = 0; i < g->used; ++i) {
            const Association *e = &g->evidence[i];
            double d = e->mean[2] - delta[2];
            variance += weights[i] * (e->variance[2] + d*d) / r.support;
        }
    }
    r.uncertainty = sqrt(variance + 1. / (1. + r.support));
    return r;
}

/* Support uncertainty is reducible by observations. Outcome dispersion need
 * not be: learning a coin is random is not a reason to flip it forever. */
static double recognition_ignorance(Recognition r)
{
    return 1. / sqrt(1. + r.support);
}

static double recognition_noise(Recognition r)
{
    double ignorance = recognition_ignorance(r);
    return sqrt(fmax(0., r.uncertainty*r.uncertainty - ignorance*ignorance));
}

static void body_learn(Embodiment *b, const Observation *o, const Observation *next)
{
    int c, i, j;
    for (c = 0; c < 2; ++c) {
        double movement = next->x[c] - o->x[c];
        double f[3] = {1., o->x[2], movement*movement}, pf[3] = {0.};
        double prediction = 0., denominator = 1., error;
        if (!b->samples) for (i = 0; i < 3; ++i) b->covariance[c][i][i] = 100.;
        for (i = 0; i < 3; ++i) {
            prediction += b->weights[c][i]*f[i];
            for (j = 0; j < 3; ++j) pf[i] += b->covariance[c][i][j]*f[j];
            denominator += f[i]*pf[i];
        }
        error = next->x[2] - prediction;
        b->error[c] += error*error;
        for (i = 0; i < 3; ++i) b->weights[c][i] += error*pf[i]/denominator;
        for (i = 0; i < 3; ++i) for (j = i; j < 3; ++j) {
            double v = b->covariance[c][i][j] - pf[i]*pf[j]/denominator;
            b->covariance[c][i][j] = b->covariance[c][j][i] = v;
        }
    }
    ++b->samples;
}

/* -1 is an unresolved distinction. These errors are evidence accumulated in
 * life; a temporary actuator failure does not erase that history. */
static int body_channel(const Embodiment *b)
{
    double sum = b->error[0] + b->error[1];
    if (b->samples < 32 || sum < 1e-12 ||
        fabs(b->error[0]-b->error[1]) < .05*sum) return -1;
    return b->error[1] < b->error[0] ? 1 : 0;
}

static void glyph_learn(Glyphs *g, const double key[AMOS_K], double action,
                        const double delta[3])
{
    int i, k, chosen = -1; double best = 0.; Association *e;
    for (i = 0; i < g->used; ++i) {
        double match = glyph_similarity(key, g->evidence[i].key, g->enabled);
        if (fabs(action - g->evidence[i].action) <= .25 && match > best)
            { best = match; chosen = i; }
    }
    if (best < .72) {
        if (g->used < AMOS_E) chosen = g->used++;
        else { chosen = 0;
            for (i = 1; i < g->used; ++i)
                if (g->evidence[i].age < g->evidence[chosen].age) chosen = i;
        }
        e = &g->evidence[chosen]; memset(e, 0, sizeof *e);
        memcpy(e->key, key, sizeof e->key); e->action = action;
    }
    e = &g->evidence[chosen]; e->mass = fmin(32., e->mass + 1.);
    for (k = 0; k < 3; ++k) {
        double a = 1. / fmin(8., e->mass), d = delta[k] - e->mean[k];
        e->mean[k] += a * d;
        e->variance[k] = (1. - a) * (e->variance[k] + a*d*d);
    }
    e->age = ++g->clock;
}

static void world_init(World *w, uint64_t seed)
{
    memset(w, 0, sizeof *w);
    w->rng = mix64(seed ^ UINT64_C(0x574f524c44)) | 1;
    w->controlled = (int)(random64(&w->rng) & 1);
    w->polarity = (random64(&w->rng) & 1) ? 1.0 : -1.0;
    w->pos[0] = .5 * signed_uniform(&w->rng);
    w->pos[1] = .5 * signed_uniform(&w->rng);
    w->target = .65;
    w->gain = 1.;
}

static void world_landmarks(World *w)
{
    int k;
    w->order = (random64(&w->rng) & 1) ? 1 : -1;
    for (k = 0; k < 2; ++k) w->cue_noise[k] = signed_uniform(&w->rng);
}

static void world_observe(const World *w, Observation *o)
{
    o->x[0] = w->pos[0]; o->x[1] = w->pos[1]; o->x[2] = w->load;
    if (w->kind) {
        unsigned phase = (unsigned)(w->tick % 6); int k;
        for (k = 0; k < 2; ++k) {
            double v = 0.;
            if (phase == 1 || phase == 2) {
                int first = w->order > 0 ? 0 : 1;
                int cue = phase == 1 ? first : 1 - first;
                v = (k == cue ? .8 : 0.) + w->jitter * w->cue_noise[k];
            }
            o->x[k] = w->offset[k] + w->gain * v;
        }
    }
}

static void world_step(World *w, double action)
{
    int c = w->controlled, other = 1 - c;
    action = clip(action, -1., 1.);
    if (w->kind) {
        unsigned phase = (unsigned)(w->tick % 6);
        if (phase == 3) w->load = action * w->order * w->polarity > .5 ? .05 : .95;
        else if (phase == 4) w->load *= .5;
        else if (phase == 5) { w->load = 0.; world_landmarks(w); }
        ++w->tick; return;
    }
    w->velocity[c] = .65 * w->velocity[c] +
        .35 * w->polarity * (1. - .5 * w->load) * action;
    w->velocity[other] = .80 * w->velocity[other] +
        .20 * signed_uniform(&w->rng);
    w->pos[c] = clip(.94 * w->pos[c] + .14 * w->velocity[c], -1., 1.);
    w->pos[other] = clip(.94 * w->pos[other] + .14 * w->velocity[other], -1., 1.);
    w->load = .90 * w->load + .10 * w->velocity[c] * w->velocity[c];
    ++w->tick;
}

static void subject_init(Subject *s, uint64_t seed, int mode)
{
    int i, j;
    memset(s, 0, sizeof *s);
    s->mode = mode;
    s->rng = mix64(seed ^ UINT64_C(0x5355424a454354)) | 1;
    for (i = 0; i < AMOS_H; ++i) {
        double sum = 0.;
        for (j = 0; j < 5; ++j)
            s->win[i][j] = (j == 4 ? .2 : .8) * signed_uniform(&s->rng);
        for (j = 0; j < AMOS_H; ++j) {
            s->recurrent[i][j] = signed_uniform(&s->rng);
            sum += fabs(s->recurrent[i][j]);
        }
        for (j = 0; j < AMOS_H; ++j)
            s->recurrent[i][j] *= .75 / sum;
    }
    for (i = 0; i < AMOS_F; ++i) s->covariance[i][i] = 100.;
}

/* This and every subject function operate on observations, never on World. */
static void subject_observe(Subject *s, const Observation *o)
{
    double next[AMOS_H], signature[AMOS_H], view[3];
    int i, j;
    s->observation = *o;
    memcpy(view, o->x, sizeof view);
    if (s->glyph.enabled) {
        Glyphs *g = &s->glyph; double norm;
        if (!g->anchored) { memcpy(g->anchor, o->x, sizeof g->anchor); g->anchored = 1; }
        for (j = 0; j < 2; ++j) view[j] -= g->anchor[j];
        norm = fmax(.2, hypot(view[0], view[1]));
        for (j = 0; j < 2; ++j) view[j] /= norm;
    }
    for (i = 0; i < AMOS_H; ++i) {
        double v = s->win[i][4];
        for (j = 0; j < 3; ++j) v += s->win[i][j] * view[j];
        signature[i] = tanh(v);
        if (s->mode == AMOS_NORMAL) {
            v += s->win[i][3] * s->previous_action;
            for (j = 0; j < AMOS_H; ++j) v += s->recurrent[i][j] * s->h[j];
            next[i] = .50 * s->h[i] + .50 * tanh(v);
        } else if (s->mode == AMOS_MEMORYLESS) {
            next[i] = tanh(v);
        } else next[i] = 0.;
    }
    memcpy(s->h, next, sizeof next);
    if (s->glyph.enabled) glyph_observe(&s->glyph, signature);
}

static void subject_features(const Subject *s, double action, double f[AMOS_F])
{
    int j;
    f[0] = 1.;
    for (j = 0; j < 3; ++j) f[1 + j] = s->observation.x[j];
    f[4] = action;
    for (j = 0; j < AMOS_H; ++j) {
        f[5 + j] = s->h[j];
        f[5 + AMOS_H + j] = action * s->h[j];
    }
    f[AMOS_F - 1] = action * action;
}

static void subject_predict(const Subject *s, double action, double prediction[3])
{
    double f[AMOS_F];
    int k, j;
    subject_features(s, action, f);
    for (k = 0; k < 3; ++k) {
        prediction[k] = s->observation.x[k];
        for (j = 0; j < AMOS_F; ++j) prediction[k] += s->weights[k][j] * f[j];
    }
    if (s->glyph.enabled && s->glyph.enabled != GLYPH_NEURAL_ONLY) {
        double delta[3], blend;
        Recognition r = glyph_predict(&s->glyph, action, delta);
        blend = r.similarity * r.support / (1. + r.support);
        for (k = 0; k < 3; ++k)
            prediction[k] += blend * (s->observation.x[k] + delta[k] - prediction[k]);
    }
}

static int subject_influence(const Subject *s, double influence[2])
{
    double lo[3], hi[3];
    subject_predict(s, -1., lo); subject_predict(s, 1., hi);
    influence[0] = fabs(hi[0] - lo[0]);
    influence[1] = fabs(hi[1] - lo[1]);
    return influence[1] > influence[0] ? 1 : 0;
}

static double subject_action(Subject *s, const Observation *o,
                             double target, double exploration)
{
    double influence[2], best = HUGE_VAL, chosen = 0.;
    int c = subject_influence(s, influence), a;
    (void)o;                         /* observe has already registered o */
    if (exploration > 0. && uniform(&s->rng) < exploration)
        return (double)((int)(random64(&s->rng) % 3) - 1);
    /* Enumerating neutral first makes an unlearned agent initially neutral. */
    for (a = 0; a < 3; ++a) {
        double action = a == 0 ? 0. : (a == 1 ? -1. : 1.);
        double p[3], d, cost;
        subject_predict(s, action, p);
        d = p[c] - target;
        cost = d*d + .03 * clip(p[2], 0., 1.) + .0001 * action * action;
        if (s->glyph.enabled) {
            double delta[3]; Recognition r = glyph_predict(&s->glyph, action, delta);
            cost = p[2] + .0001 * action * action;
            if (s->glyph.enabled != GLYPH_NEURAL_ONLY && s->glyph.learning && exploration > 0.)
                cost -= exploration * recognition_ignorance(r);
        }
        if (cost < best) { best = cost; chosen = action; }
    }
    return chosen;
}

/* Shared online RLS: recurrent connections stay fixed, readout learns in life.
 * Symmetric rank-one covariance updates avoid a directional numerical drift.
 */
static void subject_regress(Subject *s, const double f[AMOS_F], const double d[3])
{
    const double forgetting = .997;
    double pf[AMOS_F], denominator = forgetting, error[3];
    int i, j, k;
    for (i = 0; i < AMOS_F; ++i) {
        pf[i] = 0.;
        for (j = 0; j < AMOS_F; ++j) pf[i] += s->covariance[i][j] * f[j];
        denominator += f[i] * pf[i];
    }
    for (k = 0; k < 3; ++k) {
        error[k] = d[k];
        for (j = 0; j < AMOS_F; ++j) error[k] -= s->weights[k][j] * f[j];
        for (j = 0; j < AMOS_F; ++j)
            s->weights[k][j] += error[k] * pf[j] / denominator;
    }
    for (i = 0; i < AMOS_F; ++i)
        for (j = i; j < AMOS_F; ++j) {
            double p = (s->covariance[i][j] - pf[i]*pf[j]/denominator) / forgetting;
            s->covariance[i][j] = s->covariance[j][i] = p;
        }
    /* Forgetting otherwise gives unobserved directions unlimited uncertainty.
     * Congruence scaling preserves symmetry/positive definiteness and bounds
     * that windup, including the deliberately inactive features in linear mode.
     */
    for (i = 0; i < AMOS_F; ++i) if (s->covariance[i][i] > 1e8) {
        double scale = sqrt(1e8 / s->covariance[i][i]);
        for (j = 0; j < AMOS_F; ++j) s->covariance[i][j] *= scale;
        for (j = 0; j < AMOS_F; ++j) s->covariance[j][i] *= scale;
    }
    ++s->updates;
}

static void subject_transition(const Subject *s, const Observation *o, double action,
                               const Observation *next, uint64_t tick, Transition *t)
{
    memset(t, 0, sizeof *t);
    t->tick = tick; t->observation = *o; t->next = *next; t->action = action;
    subject_predict(s, action, t->predicted);
    subject_influence(s, t->influence);
    subject_features(s, action, t->features);
    if (s->glyph.enabled) {
        double delta[3];
        memcpy(t->sequence, s->glyph.sequence, sizeof t->sequence);
        t->recognition = glyph_predict(&s->glyph, action, delta);
    }
}

static void subject_learn(Subject *s, const Observation *o, double action,
                         const Observation *next, uint64_t tick, Transition *out)
{
    Transition local;
    Transition *t = out ? out : &local;
    double d[3];
    int k;
    subject_transition(s, o, action, next, tick, t);
    for (k = 0; k < 3; ++k) d[k] = next->x[k] - o->x[k];
    subject_regress(s, t->features, d);
    body_learn(&s->body, o, next);
    if (s->glyph.enabled) glyph_learn(&s->glyph, t->sequence, action, d);
    s->previous_action = action;
}

static void snapshot_init(Snapshot *s, uint64_t seed, int mode)
{
    memset(s, 0, sizeof *s);
    s->seed = seed;
    s->birth = mix64(seed ^ UINT64_C(0x414d4f532d424952));
    world_init(&s->world, seed);
    subject_init(&s->subject, seed, mode);
}

static void snapshot_sequence(Snapshot *s, uint64_t seed, int glyph_mode)
{
    snapshot_init(s, seed, AMOS_NORMAL);
    s->world.kind = 1; s->world.jitter = .02; s->world.load = 0.;
    s->world.target = 0.;
    s->subject.glyph.enabled = glyph_mode; s->subject.glyph.learning = 1;
    world_landmarks(&s->world);
}

static void snapshot_remember(Snapshot *s, const Transition *t)
{
    unsigned index = (s->memory_start + s->memory_count) % AMOS_MEMORY;
    if (s->memory_count < AMOS_MEMORY) ++s->memory_count;
    else s->memory_start = (s->memory_start + 1) % AMOS_MEMORY;
    s->memory[index] = *t;
}

static void snapshot_step(Snapshot *s, double forced_action, int learn,
                          double exploration, Transition *out)
{
    Observation o, next;
    Transition t;
    double action;
    if (s->subject.glyph.enabled) s->subject.glyph.learning = learn;
    world_observe(&s->world, &o);
    subject_observe(&s->subject, &o);
    action = isnan(forced_action) ?
        subject_action(&s->subject, &o, s->world.target, exploration) : forced_action;
    action = clip(action, -1., 1.);
    world_step(&s->world, action);
    world_observe(&s->world, &next);
    if (learn) subject_learn(&s->subject, &o, action, &next, s->world.tick, &t);
    else {
        subject_transition(&s->subject, &o, action, &next, s->world.tick, &t);
        s->subject.previous_action = action;
    }
    snapshot_remember(s, &t);
    if (out) *out = t;
}

/* Bounded future experience changes only the acquired predictor. Cached neural
 * features retain their original context; live hidden state and both RNGs stay
 * in the restored past. No future world state is copied into the subject.
 */
static int snapshot_scar(Snapshot *past, const Snapshot *future)
{
    unsigned i, count = 0;
    if (!snapshot_valid(past) || !snapshot_valid(future) ||
        past->birth != future->birth || past->seed != future->seed ||
        past->subject.mode != future->subject.mode ||
        memcmp(past->subject.win, future->subject.win, sizeof past->subject.win) ||
        memcmp(past->subject.recurrent, future->subject.recurrent,
               sizeof past->subject.recurrent) ||
        future->world.tick <= past->world.tick ||
        past->subject.glyph.enabled != future->subject.glyph.enabled ||
        past->subject.glyph.count > future->subject.glyph.count ||
        memcmp(past->subject.glyph.prototypes, future->subject.glyph.prototypes,
               (size_t)past->subject.glyph.count * AMOS_H * sizeof(double))) return 0;
    for (i = 0; i < future->memory_count; ++i) {
        const Transition *t = &future->memory[(future->memory_start+i)%AMOS_MEMORY];
        if (t->tick > past->world.tick && t->tick <= future->world.tick) ++count;
    }
    if (!count) return 0;
    if (past->subject.glyph.enabled) {
        past->subject.glyph.count = future->subject.glyph.count;
        memcpy(past->subject.glyph.prototypes, future->subject.glyph.prototypes,
               sizeof past->subject.glyph.prototypes);
    }
    for (i = 0; i < future->memory_count; ++i) {
        const Transition *t = &future->memory[(future->memory_start+i)%AMOS_MEMORY];
        double delta[3];
        int k;
        if (t->tick <= past->world.tick || t->tick > future->world.tick) continue;
        for (k = 0; k < 3; ++k) delta[k] = t->next.x[k] - t->observation.x[k];
        subject_regress(&past->subject, t->features, delta);
        if (past->subject.glyph.enabled)
            glyph_learn(&past->subject.glyph, t->sequence, t->action, delta);
    }
    return 1;
}

/* Explicit little-endian binary64 format, no pointers, padding or struct dump.
 * Every payload byte is covered by FNV-1a. This detects corruption, not malice.
 */
typedef struct { FILE *file; uint64_t hash; int ok, reading; } StateIO;

static unsigned char state_byte(StateIO *io, unsigned char b)
{
    if (io->reading) {
        int c = fgetc(io->file);
        if (c == EOF) { io->ok = 0; b = 0; } else b = (unsigned char)c;
    } else if (fputc(b, io->file) == EOF) io->ok = 0;
    io->hash = (io->hash ^ b) * UINT64_C(1099511628211);
    return b;
}

static void state_u64(StateIO *io, uint64_t *v)
{
    uint64_t n = io->reading ? 0 : *v;
    int i;
    for (i = 0; i < 8; ++i) {
        unsigned char b = state_byte(io, (unsigned char)(n >> (i*8)));
        if (io->reading) n |= (uint64_t)b << (i*8);
    }
    if (io->reading) *v = n;
}

static void state_double(StateIO *io, double *v)
{
    uint64_t bits = 0;
    if (!io->reading) memcpy(&bits, v, 8);
    state_u64(io, &bits);
    if (io->reading) memcpy(v, &bits, 8);
    if (!isfinite(*v) || fabs(*v) > 1e30) io->ok = 0;
}

static void state_vector(StateIO *io, double *v, int n)
{
    int i;
    for (i = 0; i < n; ++i) state_double(io, &v[i]);
}

static void state_content(StateIO *io, Snapshot *s)
{
    uint64_t n;
    unsigned i;
    int j, version = 3;
    const char header[] = "AMOS0003";
    for (i = 0; i < 8; ++i)
    {
        unsigned char b = state_byte(io, (unsigned char)header[i]);
        if (i == 7 && (b >= '1' && b <= '3')) version = b - '0';
        else if (b != (unsigned char)header[i]) io->ok = 0;
    }
    state_u64(io, &s->seed); state_u64(io, &s->birth);
    state_vector(io, s->world.pos, 2); state_vector(io, s->world.velocity, 2);
    state_double(io, &s->world.load); state_double(io, &s->world.target);
    state_double(io, &s->world.polarity);
    n = (uint64_t)s->world.controlled; state_u64(io, &n);
    if (n > 1) io->ok = 0; else s->world.controlled = (int)n;
    state_u64(io, &s->world.rng); state_u64(io, &s->world.tick);
    state_vector(io, s->subject.h, AMOS_H);
    for (j = 0; j < AMOS_H; ++j) {
        state_vector(io, s->subject.win[j], 5);
        state_vector(io, s->subject.recurrent[j], AMOS_H);
    }
    for (j = 0; j < 3; ++j) state_vector(io, s->subject.weights[j], AMOS_F);
    for (j = 0; j < AMOS_F; ++j) state_vector(io, s->subject.covariance[j], AMOS_F);
    state_double(io, &s->subject.previous_action);
    state_vector(io, s->subject.observation.x, 3);
    n = (uint64_t)s->subject.mode; state_u64(io, &n);
    if (n > AMOS_LINEAR) io->ok = 0; else s->subject.mode = (int)n;
    state_u64(io, &s->subject.rng); state_u64(io, &s->subject.updates);
    n = s->memory_start; state_u64(io, &n);
    if (n >= AMOS_MEMORY) io->ok = 0; else s->memory_start = (unsigned)n;
    n = s->memory_count; state_u64(io, &n);
    if (n > AMOS_MEMORY) io->ok = 0; else s->memory_count = (unsigned)n;
    for (i = 0; i < AMOS_MEMORY; ++i) {
        Transition *t = &s->memory[i];
        state_u64(io, &t->tick); state_vector(io, t->observation.x, 3);
        state_vector(io, t->next.x, 3); state_double(io, &t->action);
        state_vector(io, t->predicted, 3); state_vector(io, t->influence, 2);
        state_vector(io, t->features, AMOS_F);
    }
    if (version == 1) { s->world.gain = 1.; return; }
    n = (uint64_t)s->world.kind; state_u64(io, &n);
    if (n > 1) io->ok = 0; else s->world.kind = (int)n;
    n = (uint64_t)(s->world.order + 1); state_u64(io, &n);
    if (n > 2) io->ok = 0; else s->world.order = (int)n - 1;
    state_double(io, &s->world.gain); state_vector(io, s->world.offset, 2);
    state_double(io, &s->world.jitter); state_vector(io, s->world.cue_noise, 2);
    {
        Glyphs *g = &s->subject.glyph;
        int *fields[] = {&g->enabled, &g->learning, &g->anchored, &g->count, &g->used};
        const unsigned limits[] = {GLYPH_EVENTS, 1, 1, AMOS_G, AMOS_E};
        for (j = 0; j < 5; ++j) {
            n = (uint64_t)*fields[j]; state_u64(io, &n);
            if (n > limits[j]) io->ok = 0; else *fields[j] = (int)n;
        }
        state_vector(io, g->anchor, 2);
        for (j = 0; j < AMOS_G; ++j) state_vector(io, g->prototypes[j], AMOS_H);
        state_vector(io, g->sequence, AMOS_K); state_vector(io, g->familiarity, AMOS_L);
        state_u64(io, &g->clock);
        for (j = 0; j < AMOS_E; ++j) {
            Association *e = &g->evidence[j];
            state_vector(io, e->key, AMOS_K); state_vector(io, e->mean, 3);
            state_vector(io, e->variance, 3); state_double(io, &e->mass);
            state_double(io, &e->action); state_u64(io, &e->age);
        }
    }
    for (i = 0; i < AMOS_MEMORY; ++i) {
        Transition *t = &s->memory[i];
        state_vector(io, t->sequence, AMOS_K);
        state_double(io, &t->recognition.similarity);
        state_double(io, &t->recognition.support);
        state_double(io, &t->recognition.uncertainty);
    }
    if (version < 3) return;
    for (j = 0; j < AMOS_L; ++j) state_u64(io, &s->subject.glyph.duration[j]);
    for (j = 0; j < 2; ++j) {
        int k;
        state_vector(io, s->subject.body.weights[j], 3);
        for (k = 0; k < 3; ++k) state_vector(io, s->subject.body.covariance[j][k], 3);
        state_double(io, &s->subject.body.error[j]);
    }
    state_u64(io, &s->subject.body.samples);
}

static int snapshot_valid(const Snapshot *s)
{
    unsigned i;
    int j;
    const Glyphs *g = &s->subject.glyph;
    uint64_t previous = 0;
    if (s->birth != mix64(s->seed ^ UINT64_C(0x414d4f532d424952)) ||
        !s->world.rng || !s->subject.rng ||
        s->world.controlled < 0 || s->world.controlled > 1 ||
        fabs(s->world.polarity) != 1. ||
        s->world.load < 0. || s->world.load > 1. ||
        fabs(s->world.pos[0]) > 1. || fabs(s->world.pos[1]) > 1. ||
        fabs(s->subject.previous_action) > 1. ||
        s->memory_count > AMOS_MEMORY || s->memory_start >= AMOS_MEMORY ||
        s->world.kind < 0 || s->world.kind > 1 ||
        (s->world.kind && abs(s->world.order) != 1) ||
        !(s->world.gain > 0.) || s->world.jitter < 0. ||
        g->enabled < 0 || g->enabled > GLYPH_EVENTS ||
        g->count < 0 || g->count > AMOS_G || g->used < 0 || g->used > AMOS_E ||
        g->learning < 0 || g->learning > 1 || g->anchored < 0 || g->anchored > 1) return 0;
    if (s->subject.body.error[0] < 0. || s->subject.body.error[1] < 0.) return 0;
    for (j = 0; j < g->used; ++j) {
        const Association *e = &g->evidence[j]; int k;
        if (e->mass < 1. || e->mass > 32. || fabs(e->action) > 1. ||
            !e->age || e->age > g->clock) return 0;
        for (k = 0; k < 3; ++k) if (e->variance[k] < 0.) return 0;
        for (k = 0; k < AMOS_K; ++k) if (e->key[k] < 0. || e->key[k] > 1.) return 0;
    }
    for (j = 0; j < AMOS_K; ++j)
        if (g->sequence[j] < 0. || g->sequence[j] > 1.) return 0;
    for (j = 0; j < AMOS_L; ++j)
        if (g->familiarity[j] < 0. || g->familiarity[j] > 1.) return 0;
    for (i = 0; i < s->memory_count; ++i) {
        const Transition *t = &s->memory[(s->memory_start+i)%AMOS_MEMORY];
        if (!t->tick || t->tick <= previous || t->tick > s->world.tick ||
            fabs(t->action) > 1.) return 0;
        previous = t->tick;
    }
    return 1;
}

static int state_finish(StateIO *io)
{
    uint64_t expected = io->hash, actual = 0;
    int i;
    for (i = 0; i < 8; ++i) {
        if (io->reading) {
            int c = fgetc(io->file);
            if (c == EOF) io->ok = 0;
            else actual |= (uint64_t)(unsigned char)c << (8*i);
        } else if (fputc((unsigned char)(expected >> (8*i)), io->file) == EOF) io->ok = 0;
    }
    if (io->reading && (actual != expected || fgetc(io->file) != EOF)) io->ok = 0;
    if (ferror(io->file)) io->ok = 0;
    return io->ok;
}

static int snapshot_save(const Snapshot *s, const char *path)
{
    StateIO io;
    Snapshot *copy;
    char *temporary;
    int ok;
    if (sizeof(double) != 8 || DBL_MANT_DIG != 53 || !snapshot_valid(s)) return 0;
    temporary = (char *)malloc(strlen(path) + 5);
    copy = (Snapshot *)malloc(sizeof *copy);
    if (!temporary || !copy) { free(temporary); free(copy); return 0; }
    strcpy(temporary, path); strcat(temporary, ".tmp");
    *copy = *s;
    io.file = fopen(temporary, "wb"); io.hash = UINT64_C(14695981039346656037);
    io.reading = 0; io.ok = 1;
    if (!io.file) { free(copy); free(temporary); return 0; }
    state_content(&io, copy);
    ok = state_finish(&io);
    if (fclose(io.file) != 0) ok = 0;
    if (ok && rename(temporary, path) != 0) ok = 0;
    if (!ok) remove(temporary);
    free(copy); free(temporary);
    return ok;
}

static int snapshot_load(Snapshot *s, const char *path)
{
    StateIO io;
    Snapshot *copy;
    int ok;
    if (sizeof(double) != 8 || DBL_MANT_DIG != 53) return 0;
    io.file = fopen(path, "rb");
    if (!io.file) return 0;
    copy = (Snapshot *)calloc(1, sizeof *copy);
    if (!copy) { fclose(io.file); return 0; }
    io.hash = UINT64_C(14695981039346656037); io.reading = 1; io.ok = 1;
    state_content(&io, copy);
    ok = state_finish(&io) && snapshot_valid(copy);
    if (fclose(io.file) != 0) ok = 0;
    if (ok) *s = *copy;
    free(copy);
    return ok;
}

#ifndef AMOS_NO_MAIN
static void trace_transition(FILE *f, const Snapshot *s, const Transition *t)
{
    double error = 0.;
    int c = t->influence[1] > t->influence[0] ? 1 : 0, k;
    const char *channel = s->subject.glyph.enabled ? "null" : (c ? "1" : "0");
    for (k = 0; k < 3; ++k) {
        double d = t->next.x[k] - t->predicted[k]; error += d*d;
    }
    fprintf(f, "{\"birth\":\"%016" PRIx64 "\",\"tick\":%" PRIu64
        ",\"observation\":[%.9g,%.9g,%.9g],\"action\":%.9g,"
        "\"predicted\":[%.9g,%.9g,%.9g],\"actual\":[%.9g,%.9g,%.9g],"
        "\"target\":%.9g,\"influence\":[%.9g,%.9g],\"inferred_channel\":%s,"
        "\"prediction_error\":%.9g,\"updates\":%" PRIu64,
        s->birth, t->tick, t->observation.x[0], t->observation.x[1],
        t->observation.x[2], t->action, t->predicted[0], t->predicted[1],
        t->predicted[2], t->next.x[0], t->next.x[1], t->next.x[2],
        s->world.target, t->influence[0], t->influence[1], channel,
        sqrt(error/3.), s->subject.updates);
    if (s->subject.glyph.enabled) {
        int i, j;
        fprintf(f, ",\"objective\":\"minimize_load\",\"recognition\":{\"similarity\":%.9g,\"support\":%.9g,"
            "\"uncertainty\":%.9g},\"glyphs\":[", t->recognition.similarity,
            t->recognition.support, t->recognition.uncertainty);
        for (i = 0; i < AMOS_L; ++i) {
            int best = 0;
            for (j = 1; j < AMOS_G; ++j)
                if (t->sequence[i*AMOS_G+j] > t->sequence[i*AMOS_G+best]) best = j;
            fprintf(f, "%s%d", i ? "," : "", best);
        }
        fputs("],\"glyph_mixture\":[", f);
        for (j = 0; j < AMOS_G; ++j)
            fprintf(f, "%s%.9g", j ? "," : "", t->sequence[AMOS_K - AMOS_G + j]);
        fputs("]", f);
    }
    if (s->subject.glyph.enabled == GLYPH_EVENTS) {
        fprintf(f, ",\"ignorance\":%.9g,\"outcome_noise\":%.9g,\"event_duration\":[",
            recognition_ignorance(t->recognition), recognition_noise(t->recognition));
        for (k = 0; k < AMOS_L; ++k)
            fprintf(f, "%s%" PRIu64, k ? "," : "", s->subject.glyph.duration[k]);
        fputs("]", f);
    }
    fputs("}\n", f);
}

static int parse_u64(const char *text, uint64_t *v)
{
    char *end;
    unsigned long long value;
    if (!text[0] || text[0] == '-') return 0;
    errno = 0; value = strtoull(text, &end, 10);
    if (errno || *end) return 0;
    *v = (uint64_t)value;
    return (unsigned long long)*v == value;
}

static void help(void)
{
    puts("AMOS — Arianna Method Ontological Subjectivity\n"
         "  amos demo [--seed N] [--steps N] [--mode normal|memoryless|linear]\n"
         "            [--explore P] [--state FILE] [--trace FILE] [--frozen]\n"
         "            [--world sequence] [--glyphs sequence|events|bag|neural]\n"
         "            [--appearance plain|shifted]\n"
         "  amos resume FILE [--steps N] [--state FILE] [--trace FILE]\n"
         "              [--explore P] [--frozen] [--reverse-body]\n"
         "  amos scar PAST FUTURE OUTPUT\n"
         "  amos inspect FILE\n"
         "Every step prints one JSON record; --trace additionally saves those records.\n"
         "--state writes the complete final state. Resume defaults to that input file.\n"
         "Birth is an immutable origin ID. Tick is logical time, starting at zero.\n"
         "Online learning is enabled unless --frozen; default exploration is 0.25.\n"
         "Sequence mode anticipates bodily load; glyphs are acquired during life.\n"
         "--appearance recalibrates the sensor origin at a six-step trial boundary.\n"
         "Sequence exploration favors unsupported actions, not known outcome noise.\n"
         "--reverse-body intervenes on the actuator without informing the subject.");
}

int main(int argc, char **argv)
{
    Snapshot *s;
    uint64_t seed = 1, steps = 400, i;
    const char *state = NULL, *trace = NULL, *resume = NULL;
    double exploration = .25;
    int mode = AMOS_NORMAL, frozen = 0, reverse_body = 0, index = 1, result = 1;
    int sequence_world = 0, glyph_mode = GLYPH_SEQUENCE, appearance = -1;
    FILE *log = NULL;
    if (argc > 1 && (!strcmp(argv[1], "--help") || !strcmp(argv[1], "-h"))) {
        help(); return 0;
    }
    s = (Snapshot *)calloc(1, sizeof *s);
    if (!s) { fputs("AMOS: allocation failed\n", stderr); return 1; }
    if (argc > 1 && !strcmp(argv[1], "inspect")) {
        if (argc != 3 || !snapshot_load(s, argv[2])) {
            fputs("AMOS: inspect requires a valid snapshot\n", stderr);
        } else {
            int k;
            printf("{\"birth\":\"%016" PRIx64 "\",\"tick\":%" PRIu64
                ",\"body_channel\":%d,\"body_samples\":%" PRIu64
                ",\"body_prediction_sse\":[%.9g,%.9g],\"glyphs\":%d,\"event_duration\":[",
                s->birth, s->world.tick, body_channel(&s->subject.body), s->subject.body.samples,
                s->subject.body.error[0], s->subject.body.error[1], s->subject.glyph.count);
            for (k = 0; k < AMOS_L; ++k) printf("%s%" PRIu64, k ? "," : "", s->subject.glyph.duration[k]);
            puts("]}"); result = ferror(stdout) ? 1 : 0;
        }
        free(s); return result;
    }
    if (argc > 1 && !strcmp(argv[1], "scar")) {
        Snapshot *future = (Snapshot *)malloc(sizeof *future);
        if (argc != 5 || !future || !snapshot_load(s, argv[2]) ||
            !snapshot_load(future, argv[3]) || !snapshot_scar(s, future) ||
            !snapshot_save(s, argv[4])) {
            fputs("AMOS: scar requires valid compatible PAST FUTURE OUTPUT\n", stderr);
        } else {
            printf("{\"scar\":true,\"birth\":\"%016" PRIx64 "\",\"tick\":%" PRIu64
                   ",\"updates\":%" PRIu64 "}\n", s->birth, s->world.tick, s->subject.updates);
            result = 0;
        }
        free(future); free(s); return result;
    }
    if (argc > 1 && !strcmp(argv[1], "demo")) index = 2;
    else if (argc > 1 && !strcmp(argv[1], "resume")) {
        if (argc < 3) goto usage;
        resume = state = argv[2]; index = 3;
    }
    while (index < argc) {
        const char *option = argv[index++], *value;
        if (!strcmp(option, "--frozen")) { frozen = 1; continue; }
        if (!strcmp(option, "--reverse-body")) { reverse_body = 1; continue; }
        if (index >= argc) goto usage;
        value = argv[index++];
        if (!strcmp(option, "--seed")) {
            if (resume || !parse_u64(value, &seed)) goto usage;
        } else if (!strcmp(option, "--steps")) {
            if (!parse_u64(value, &steps)) goto usage;
        } else if (!strcmp(option, "--state")) state = value;
        else if (!strcmp(option, "--trace")) trace = value;
        else if (!strcmp(option, "--world")) {
            if (resume || strcmp(value, "sequence")) goto usage;
            sequence_world = 1;
        } else if (!strcmp(option, "--glyphs")) {
            if (resume) goto usage;
            if (!strcmp(value, "sequence")) glyph_mode = GLYPH_SEQUENCE;
            else if (!strcmp(value, "events")) glyph_mode = GLYPH_EVENTS;
            else if (!strcmp(value, "bag")) glyph_mode = GLYPH_BAG;
            else if (!strcmp(value, "neural")) glyph_mode = GLYPH_NEURAL_ONLY;
            else goto usage;
        } else if (!strcmp(option, "--appearance")) {
            if (!strcmp(value, "plain")) appearance = 0;
            else if (!strcmp(value, "shifted")) appearance = 1;
            else goto usage;
        }
        else if (!strcmp(option, "--mode")) {
            if (resume) goto usage;
            if (!strcmp(value, "normal")) mode = AMOS_NORMAL;
            else if (!strcmp(value, "memoryless")) mode = AMOS_MEMORYLESS;
            else if (!strcmp(value, "linear")) mode = AMOS_LINEAR;
            else goto usage;
        } else if (!strcmp(option, "--explore")) {
            char *end;
            exploration = strtod(value, &end);
            if (!value[0] || *end || !isfinite(exploration) || exploration < 0. || exploration > 1.) goto usage;
        } else goto usage;
    }
    if (resume) {
        if (!snapshot_load(s, resume)) { fputs("AMOS: invalid or unreadable state\n", stderr); goto done; }
    } else if (sequence_world) {
        snapshot_sequence(s, seed, glyph_mode); s->subject.mode = mode;
    } else snapshot_init(s, seed, mode);
    if (appearance >= 0) {
        if (!s->world.kind || s->world.tick % 6) goto usage;
        s->world.gain = appearance ? 1.6 : 1.;
        s->world.offset[0] = appearance ? -.4 : 0.;
        s->world.offset[1] = appearance ? .3 : 0.;
        s->world.jitter = appearance ? .10 : .02;
        s->subject.glyph.anchored = 0;
    }
    if (reverse_body) s->world.polarity = -s->world.polarity;
    if (steps > UINT64_MAX - s->world.tick) goto usage;
    if (trace) {
        if ((state && !strcmp(trace, state)) || (resume && !strcmp(trace, resume))) {
            fputs("AMOS: trace must differ from state paths\n", stderr); goto done;
        }
        log = fopen(trace, "wb");
        if (!log) { fputs("AMOS: cannot open trace\n", stderr); goto done; }
    }
    for (i = 0; i < steps; ++i) {
        Transition t;
        snapshot_step(s, NAN, !frozen, exploration, &t);
        trace_transition(stdout, s, &t);
        if (log) trace_transition(log, s, &t);
    }
    if (log) {
        int ok = !ferror(log);
        if (fclose(log) != 0) ok = 0;
        log = NULL;
        if (!ok) { fputs("AMOS: failed writing trace\n", stderr); goto done; }
    }
    if (state && !snapshot_save(s, state)) { fputs("AMOS: failed saving state\n", stderr); goto done; }
    result = ferror(stdout) ? 1 : 0;
    goto done;
usage:
    fputs("AMOS: invalid arguments; see --help\n", stderr);
done:
    if (log) fclose(log);
    free(s);
    return result;
}
#endif

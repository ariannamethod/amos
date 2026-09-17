/* AMOS-1 court. Hidden facts below belong to the evaluator, never Subject. */
#define AMOS_NO_MAIN
#include "amos.c"

typedef struct {
    double mse, similarity, uncertainty, support;
    unsigned correct, decisions;
} Score;

static double probe(uint64_t *rng) { return (double)(random64(rng)%3) - 1.; }

static void experience(Snapshot *s, unsigned trials, uint64_t seed)
{
    unsigned i; uint64_t rng = mix64(seed) | 1;
    for (i = 0; i < trials*6; ++i) snapshot_step(s, probe(&rng), 1, 0., NULL);
}

/* New physical instance, first neutral observation re-establishes the sensor
 * origin. No mapping/order/polarity is passed to the subject. */
static void encounter(Snapshot *s, uint64_t seed, int appearance)
{
    uint64_t tick = s->world.tick;
    double polarity = s->world.polarity;
    world_init(&s->world, seed); s->world.kind = 1;
    s->world.polarity = polarity; s->world.tick = tick;
    s->world.jitter = appearance == 2 ? .30 : (appearance ? .10 : .02);
    s->world.gain = appearance ? 1.6 : 1.;
    s->world.offset[0] = appearance ? -.4 : 0.;
    s->world.offset[1] = appearance ? .3 : 0.;
    world_landmarks(&s->world);
    s->subject.glyph.anchored = 0;
    memset(s->subject.glyph.sequence, 0, sizeof s->subject.glyph.sequence);
    memset(s->subject.glyph.familiarity, 0, sizeof s->subject.glyph.familiarity);
    memset(s->subject.h, 0, sizeof s->subject.h);
    s->subject.previous_action = 0.;
}

static Score score(Snapshot *s, unsigned trials, int shuffled)
{
    Score r = {0}; unsigned t;
    for (t = 0; t < trials*6; ++t) {
        int gate = s->world.tick % 6 == 3;
        double action = NAN;
        if (gate) {
            Subject mind = s->subject; Observation o; int a, k;
            world_observe(&s->world, &o); mind.glyph.learning = 0;
            subject_observe(&mind, &o);
            if (shuffled) for (k = 0; k < AMOS_G; ++k) {
                double x = mind.glyph.sequence[AMOS_G+k];
                mind.glyph.sequence[AMOS_G+k] = mind.glyph.sequence[2*AMOS_G+k];
                mind.glyph.sequence[2*AMOS_G+k] = x;
            }
            action = subject_action(&mind, &o, 0., 0.);
            r.correct += action*s->world.order*s->world.polarity > .5;
            ++r.decisions;
            for (a = -1; a <= 1; ++a) {
                double p[3], delta[3];
                double truth = a*s->world.order*s->world.polarity > .5 ? .05 : .95;
                Recognition rec = glyph_predict(&mind.glyph, (double)a, delta);
                subject_predict(&mind, (double)a, p);
                r.mse += (p[2]-truth)*(p[2]-truth)/3.;
                r.similarity += rec.similarity/3.;
                r.uncertainty += rec.uncertainty/3.; r.support += rec.support/3.;
            }
        }
        snapshot_step(s, action, 0, 0., NULL);
    }
    r.mse /= r.decisions; r.similarity /= r.decisions;
    r.uncertainty /= r.decisions; r.support /= r.decisions;
    return r;
}

static void print_score(const Score *s)
{
    printf("{\"correct\":%u,\"decisions\":%u,\"load_mse\":%.12g,"
           "\"similarity\":%.12g,\"uncertainty\":%.12g,\"support\":%.12g}",
           s->correct,s->decisions,s->mse,s->similarity,s->uncertainty,s->support);
}

static Recognition unfamiliar(const Snapshot *trained)
{
    Subject s = trained->subject;
    const Observation observations[4] = {{{0.,0.,0.}}, {{-.8,0.,0.}},
                                          {{0.,-.8,0.}}, {{0.,0.,0.}}};
    double delta[3]; int i;
    s.glyph.anchored = 0; s.glyph.learning = 0;
    memset(s.glyph.sequence, 0, sizeof s.glyph.sequence);
    memset(s.h, 0, sizeof s.h); s.previous_action = 0.;
    for (i = 0; i < 4; ++i) subject_observe(&s, &observations[i]);
    return glyph_predict(&s.glyph, 1., delta);
}

/* Identical landmark evidence can have conflicting consequences. The law is
 * resampled independently per trial, without giving the random bit to Subject. */
static void conflicting_experience(Snapshot *s, uint64_t seed)
{
    uint64_t rng = mix64(seed) | 1; unsigned i, t;
    for (i = 0; i < 200; ++i) {
        s->world.polarity = random64(&rng) & 1 ? 1. : -1.;
        for (t = 0; t < 6; ++t) snapshot_step(s, probe(&rng), 1, 0., NULL);
    }
}

int main(int argc, char **argv)
{
    unsigned first = 2001, count = 32, i, m;
    if (argc == 2 && !strcmp(argv[1], "--dev")) { first = 1; count = 8; }
    else if (argc != 1) return 2;
    for (i = 0; i < count; ++i) {
        uint64_t seed = first+i;
        Snapshot models[3], s;
        Score plain, transfer[3], perturbed, shuffled, wrong, mid, repaired, conflict;
        Recognition novel;
        for (m = 0; m < 3; ++m) {
            snapshot_sequence(&models[m], seed, (int)m+1);
            experience(&models[m], 320, seed+7654);
            s = models[m]; encounter(&s, seed+10000, 1);
            transfer[m] = score(&s, 96, 0);
        }
        s = models[0]; encounter(&s, seed+10000, 0); plain = score(&s, 96, 0);
        s = models[0]; encounter(&s, seed+10000, 2); perturbed = score(&s, 96, 0);
        s = models[0]; encounter(&s, seed+10000, 1); shuffled = score(&s, 96, 1);
        novel = unfamiliar(&models[0]);
        s = models[0]; conflicting_experience(&s, seed+6543);
        encounter(&s, seed+30000, 0); conflict = score(&s, 96, 0);
        s = models[0]; encounter(&s, seed+20000, 0); s.world.polarity *= -1.;
        { Snapshot frozen = s; wrong = score(&frozen, 96, 0); }
        experience(&s, 12, seed+4444);
        { Snapshot frozen = s; encounter(&frozen, seed+20000, 0); mid = score(&frozen, 96, 0); }
        experience(&s, 108, seed+5555);
        encounter(&s, seed+20000, 0); repaired = score(&s, 96, 0);
        printf("{\"seed\":%" PRIu64 ",\"polarity\":%.0f,\"glyphs\":%d,\"associations\":%d,\"plain\":",
            seed, models[0].world.polarity, models[0].subject.glyph.count, models[0].subject.glyph.used);
        print_score(&plain); fputs(",\"transfer\":",stdout); print_score(&transfer[0]);
        fputs(",\"perturbed\":",stdout); print_score(&perturbed);
        fputs(",\"bag\":",stdout); print_score(&transfer[1]);
        fputs(",\"neural_only\":",stdout); print_score(&transfer[2]);
        fputs(",\"shuffled\":",stdout); print_score(&shuffled);
        fputs(",\"reversed_frozen\":",stdout); print_score(&wrong);
        fputs(",\"reversed_early\":",stdout); print_score(&mid);
        fputs(",\"reversed_repaired\":",stdout); print_score(&repaired);
        fputs(",\"conflicting\":",stdout); print_score(&conflict);
        printf(",\"unfamiliar\":{\"similarity\":%.12g,\"uncertainty\":%.12g,\"support\":%.12g}",
            novel.similarity, novel.uncertainty, novel.support);
        puts("}");
    }
    return 0;
}

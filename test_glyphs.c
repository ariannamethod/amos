/* Persistence and causal boundary contracts for the AMOS-1 state extension. */
#ifdef MUTATE_GLYPH_RESTORE
#define snapshot_load original_snapshot_load
#endif
#define AMOS_NO_MAIN
#include "amos.c"
#ifdef MUTATE_GLYPH_RESTORE
#undef snapshot_load
static int snapshot_load(Snapshot *s, const char *path)
{
    int ok = original_snapshot_load(s, path);
    if (ok) memset(s->subject.glyph.sequence, 0, sizeof s->subject.glyph.sequence);
    return ok;
}
#endif

static void require(int condition, const char *message)
{
    if (!condition) { fprintf(stderr, "FAIL %s\n", message); exit(1); }
}

static int same(const Snapshot *a, const Snapshot *b)
{
    FILE *x, *y; int ca, cb, equal = 1;
    require(snapshot_save(a,"compare-a.state") && snapshot_save(b,"compare-b.state"), "comparison save");
    x = fopen("compare-a.state","rb"); y = fopen("compare-b.state","rb");
    require(x && y, "comparison open");
    do { ca = fgetc(x); cb = fgetc(y); if (ca != cb) equal = 0; } while (ca != EOF && cb != EOF);
    fclose(x); fclose(y); return equal;
}

static void advance(Snapshot *s, unsigned steps, int learn)
{
    unsigned i;
    for (i = 0; i < steps; ++i) snapshot_step(s, NAN, learn, .37, NULL);
}

int main(void)
{
    Snapshot past, future, resumed, normalized;
    Glyphs before; unsigned i;
    snapshot_sequence(&past, 17, GLYPH_SEQUENCE); advance(&past, 203, 1);
    require(past.subject.glyph.count > 2 && past.subject.glyph.used > 5, "acquired field exists");
    require(snapshot_save(&past,"glyph-past.state"), "save learned glyph state");
    require(snapshot_load(&resumed,"glyph-past.state"), "load learned glyph state");
    require(same(&past,&resumed), "restore every glyph, statistic and sequence");
    future = past;
    for (i = 0; i < 149; ++i) {
        advance(&future, 1, 1); advance(&resumed, 1, 1);
        require(same(&future,&resumed), "same learned continuation after restart");
    }
    puts("PASS glyph state and 149-step exact continuation through ring wrap");

    normalized = past; before = past.subject.glyph;
    advance(&normalized, 31, 0);
    require(!memcmp(past.subject.weights,normalized.subject.weights,sizeof past.subject.weights)
            && !memcmp(past.subject.covariance,normalized.subject.covariance,sizeof past.subject.covariance)
            && past.subject.updates == normalized.subject.updates, "frozen neural learning");
    require(!memcmp(before.prototypes,normalized.subject.glyph.prototypes,sizeof before.prototypes)
            && !memcmp(before.evidence,normalized.subject.glyph.evidence,sizeof before.evidence)
            && before.count == normalized.subject.glyph.count && before.used == normalized.subject.glyph.used
            && before.clock == normalized.subject.glyph.clock, "frozen glyph acquisition");
    require(memcmp(past.subject.h,normalized.subject.h,sizeof past.subject.h) != 0,
            "frozen learning still allows neural life");
    puts("PASS frozen acquisition with live neural and sequence state");

    resumed = past;
    require(snapshot_scar(&resumed,&future), "compatible glyph scar accepted");
    require(memcmp(resumed.subject.glyph.evidence,past.subject.glyph.evidence,
                   sizeof before.evidence) != 0, "future evidence changes field");
    normalized = resumed;
    memcpy(normalized.subject.weights,past.subject.weights,sizeof past.subject.weights);
    memcpy(normalized.subject.covariance,past.subject.covariance,sizeof past.subject.covariance);
    normalized.subject.updates = past.subject.updates;
    memcpy(normalized.subject.glyph.prototypes,before.prototypes,sizeof before.prototypes);
    memcpy(normalized.subject.glyph.evidence,before.evidence,sizeof before.evidence);
    normalized.subject.glyph.count = before.count; normalized.subject.glyph.used = before.used;
    normalized.subject.glyph.clock = before.clock;
    require(same(&past,&normalized), "scar preserves world, RNGs, anchor, live sequence, h and past history");
    normalized = future; normalized.subject.glyph.prototypes[0][0] += .2;
    require(!snapshot_scar(&past,&normalized), "scar rejects incompatible glyph meanings");
    require(snapshot_load(&normalized,"glyph-past.state") && same(&normalized,&past),
            "rejected glyph scar is atomic");
    puts("PASS acquired-field scar with stable live history and prototype compatibility");

    /* The reported recognition belongs to the decision, before its outcome. */
    {
        Subject mind = past.subject; Observation o; Transition tr; double d[3], p[3];
        Recognition r;
        world_observe(&past.world,&o); mind.glyph.learning = 1; subject_observe(&mind,&o);
        r = glyph_predict(&mind.glyph,1.,d); subject_predict(&mind,1.,p);
        snapshot_step(&past,1.,1,0.,&tr);
        require(!memcmp(p,tr.predicted,sizeof p) && r.similarity == tr.recognition.similarity
            && r.support == tr.recognition.support && r.uncertainty == tr.recognition.uncertainty,
            "trace cannot borrow confidence or prediction from the future");
    }
    puts("PASS predictions and recognition precede consequences");
    return 0;
}

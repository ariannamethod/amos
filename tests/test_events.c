#define AMOS_NO_MAIN
#include "../amos.c"
#include <assert.h>

static void train(Snapshot *s,unsigned n)
{
    unsigned i;for(i=0;i<n;++i) snapshot_step(s,NAN,1,.25,NULL);
}

int main(void)
{
    Snapshot past,future,restored,scar;
    Subject a,b; Observation o={{0.,0.,0.}};
    double d[3]={0.,0.,0.}; unsigned i,changed=0,probes=0;
    snapshot_sequence(&past,17,GLYPH_EVENTS);train(&past,203);
    assert(snapshot_save(&past,"events.state") && snapshot_load(&restored,"events.state"));
    assert(!memcmp(&past,&restored,sizeof past));
    future=past;train(&future,149);train(&restored,149);
    assert(!memcmp(&future,&restored,sizeof future));
    scar=past;assert(snapshot_scar(&scar,&future));
    assert(!memcmp(&scar.world,&past.world,sizeof past.world));
    assert(!memcmp(scar.subject.h,past.subject.h,sizeof past.subject.h));
    assert(!memcmp(scar.subject.glyph.duration,past.subject.glyph.duration,sizeof past.subject.glyph.duration));
    assert(!memcmp(&scar.subject.body,&past.subject.body,sizeof past.subject.body));
    puts("PASS event duration restoration, continuation and scar boundary");

    snapshot_sequence(&past,31,GLYPH_NEURAL_ONLY);train(&past,960);
    for(i=1;i<=960;++i) {
        double p[3],q[3];unsigned j;
        a=past.subject; b=a;a.rng=b.rng=mix64(i)|1;
        for(j=0;j<(unsigned)b.glyph.used;++j) {
            b.glyph.evidence[j].variance[2]+=100.;
            b.glyph.evidence[j].mean[2]+=3.;b.glyph.evidence[j].mass=1.;
        }
        subject_predict(&a,1.,p);subject_predict(&b,1.,q);assert(!memcmp(p,q,sizeof p));
        changed+=subject_action(&a,&a.observation,0.,.1)!=subject_action(&b,&b.observation,0.,.1);
    }
    assert(!changed);puts("PASS neural-only actions isolated from associative state");

    /* Same expected consequence, one unsupported action, two known noisy ones. */
    subject_init(&a,91,AMOS_NORMAL);a.glyph.enabled=GLYPH_EVENTS;a.glyph.learning=1;
    for(i=0;i<AMOS_L;++i) a.glyph.familiarity[i]=1.;
    for(i=0;i<32;++i) {glyph_learn(&a.glyph,a.glyph.sequence,-1.,d);glyph_learn(&a.glyph,a.glyph.sequence,1.,d);}
    a.glyph.evidence[0].variance[2]=4.;a.glyph.evidence[1].variance[2]=4.;
    for(i=1;i<=200;++i) {
        uint64_t rng=mix64(i)|1;double u=uniform(&rng);
        if(u<.1) continue; /* explicitly exclude epsilon exploration */
        b=a;b.rng=mix64(i)|1;
        probes+=subject_action(&b,&o,0.,.1)==0.;
        assert(subject_action(&b,&o,0.,0.)==0.);
    }
    assert(probes>150);
    {
        double out[3];Recognition r=glyph_predict(&a.glyph,1.,out);
        assert(recognition_noise(r)>1.9 && recognition_ignorance(r)<.18);
        a.glyph.evidence[1].variance[2]=100.;
        assert(recognition_ignorance(r)==recognition_ignorance(glyph_predict(&a.glyph,1.,out)));
    }
    puts("PASS support-driven probe ignores known outcome noise");
    {
        unsigned active=0,passive=0,seed;
        for(seed=5001;seed<=5032;++seed) {
            Subject agents[2];int policy,good=(int)(mix64(seed)&1)?1:-1;
            for(policy=0;policy<2;++policy) {
                unsigned step;int found=0;
                subject_init(&agents[policy],seed,AMOS_NORMAL);
                agents[policy].glyph.enabled=GLYPH_EVENTS;agents[policy].glyph.learning=1;
                agents[policy].weights[2][0]=.4;
                for(i=0;i<AMOS_L;++i) agents[policy].glyph.familiarity[i]=1.;
                d[2]=.4;
                for(i=0;i<32;++i) glyph_learn(&agents[policy].glyph,agents[policy].glyph.sequence,0.,d);
                for(step=0;step<8;++step) {
                    double action=subject_action(&agents[policy],&o,0.,policy?.25:0.);
                    found|=action==good;
                    d[2]=action==good?0.:(action==0.?.4:.9);
                    glyph_learn(&agents[policy].glyph,agents[policy].glyph.sequence,action,d);
                }
                if(policy) active+=(unsigned)found;else passive+=(unsigned)found;
            }
        }
        printf("PROBES active=%u passive=%u births=32 budget=8\n",active,passive);
        assert(active>=30 && passive==0);
    }
    return 0;
}

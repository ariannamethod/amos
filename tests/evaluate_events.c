/* New observations, not privileged world fields, enter the subject. */
#define main legacy_court_main
#include "../evaluate_glyphs.c"
#undef main

static unsigned delayed(Snapshot s, unsigned repeats, int variable)
{
    unsigned i, k, correct = 0; uint64_t rng = mix64(s.seed+8543)|1;
    for (i=0;i<96*6;++i) {
        unsigned phase=(unsigned)(s.world.tick%6);
        if (phase==2 || (variable && phase==3)) {
            Observation held=s.subject.observation;
            unsigned n=variable ? (unsigned)(random64(&rng)%(repeats+1)) : repeats;
            s.subject.glyph.learning=0;
            for (k=0;k<n;++k) {
                s.subject.previous_action=0.; subject_observe(&s.subject,&held);
            }
        }
        snapshot_step(&s,NAN,0,0.,NULL);
        if (phase==3) correct+=s.world.load<.5;
    }
    return correct;
}

static void embodiment(uint64_t seed, int *inferred, int *retained, int *ambiguous)
{
    Subject mind, equal; Observation o={{0.,0.,0.}}, n=o, eo=o, en=o;
    uint64_t rng=mix64(seed+9811)|1; unsigned i; int body=(int)(random64(&rng)&1);
    subject_init(&mind,seed,AMOS_NORMAL); subject_init(&equal,seed,AMOS_NORMAL);
    for (i=0;i<1000;++i) {
        double a=(double)((int)(random64(&rng)%3)-1);
        /* Both objects answer the same motor command, with independent kicks. */
        double movement[2]={.4*a+.4*signed_uniform(&rng),.4*a+.4*signed_uniform(&rng)};
        n.x[0]=o.x[0]+movement[0]; n.x[1]=o.x[1]+movement[1];
        n.x[2]=.9*o.x[2]+.1*movement[body]*movement[body];
        body_learn(&mind.body,&o,&n); o=n;
        en.x[0]=en.x[1]=eo.x[0]+movement[0];
        en.x[2]=.9*eo.x[2]+.1*movement[0]*movement[0];
        body_learn(&equal.body,&eo,&en); eo=en;
    }
    *inferred=body_channel(&mind.body)==body;
    *ambiguous=body_channel(&equal.body)==-1;
    for (i=0;i<200;++i) {
        n=o; n.x[1-body]+=.4*signed_uniform(&rng); n.x[2]*=.9;
        body_learn(&mind.body,&o,&n); o=n;
    }
    *retained=body_channel(&mind.body)==body;
}

int main(int argc,char **argv)
{
    unsigned first=5001,count=32,i,m,k; unsigned delay[]={0,1,2,4,8};
    if (argc==2 && !strcmp(argv[1],"--dev")) {first=1;count=8;}
    for(i=0;i<count;++i) {
        int identified,retained,ambiguous;
        printf("{\"seed\":%u",first+i);
        for(m=0;m<2;++m) {
            Snapshot trained,s;
            snapshot_sequence(&trained,first+i,m ? GLYPH_EVENTS : GLYPH_SEQUENCE);
            experience(&trained,320,first+i+7654);
            printf(",\"%s\":[",m ? "events" : "frames");
            for(k=0;k<5;++k) {
                s=trained;encounter(&s,first+i+10000,1);
                memset(s.subject.glyph.duration,0,sizeof s.subject.glyph.duration);
                printf("%s%u",k ? "," : "",delayed(s,delay[k],0));
            }
            s=trained;encounter(&s,first+i+10000,1);
            memset(s.subject.glyph.duration,0,sizeof s.subject.glyph.duration);
            printf("],\"%s_variable\":%u",m ? "events" : "frames",delayed(s,8,1));
        }
        embodiment(first+i,&identified,&retained,&ambiguous);
        printf(",\"body\":%d,\"body_interrupted\":%d,\"ambiguous\":%d}\n",identified,retained,ambiguous);
    }
    return 0;
}

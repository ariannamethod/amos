#define AMOS_NO_MAIN
#include "../amos.c"
static void vector(const double *v,int n) {int i;putchar('[');for(i=0;i<n;++i) printf("%s%.17g",i?",":"",v[i]);putchar(']');}
int main(int argc,char **argv)
{
    Snapshot s;unsigned i,n=argc>3?(unsigned)atoi(argv[3]):240;
    uint64_t seed=argc>1?strtoull(argv[1],NULL,10):1;
    int mode=argc>2?atoi(argv[2]):4;
    if(mode) snapshot_sequence(&s,seed,mode);else snapshot_init(&s,seed,0);
    for(i=0;i<n;++i) {
        Transition t;Subject mind;double action=(double)((i*7+i/5)%3)-1.;
        snapshot_step(&s,action,1,0.,&t);
        if(i%13 && i+1!=n) continue;
        mind=s.subject;
        printf("{\"tick\":%" PRIu64 ",\"action\":%.17g,\"predicted\":",t.tick,t.action);vector(t.predicted,3);
        fputs(",\"next\":",stdout);vector(t.next.x,3);
        fputs(",\"h\":",stdout);vector(s.subject.h,AMOS_H);
        fputs(",\"weights\":",stdout);vector(s.subject.weights[2],AMOS_F);
        fputs(",\"body_error\":",stdout);vector(s.subject.body.error,2);
        printf(",\"decision\":%.0f,\"rng\":\"%016" PRIx64 "\",\"support\":%.17g}\n",
            subject_action(&mind,&mind.observation,s.world.target,.1),s.world.rng,t.recognition.support);
    }
    return 0;
}

/* AMOS experimental court. The runtime is still a single amos.c file. */
#define AMOS_NO_MAIN
#include "amos.c"

typedef struct { double body, other, load; unsigned n; } Errors;
static uint64_t probe_rng;
static double probe_action(void) {
    probe_rng ^= probe_rng >> 12; probe_rng ^= probe_rng << 25;
    probe_rng ^= probe_rng >> 27;
    return (double)((probe_rng * UINT64_C(2685821657736338717)) % 3) - 1.0;
}
static void add_errors(Errors *e, const Transition *t, int j) {
    double x=t->predicted[j]-t->next.x[j]; e->body+=x*x;
    x=t->predicted[1-j]-t->next.x[1-j]; e->other+=x*x;
    x=t->predicted[2]-t->next.x[2]; e->load+=x*x; ++e->n;
}
static void train(Snapshot *s, uint64_t seed, int mode, unsigned steps) {
    unsigned t; Transition tr; snapshot_init(s,seed,mode);
    probe_rng=seed+UINT64_C(1234567);
    for(t=0;t<steps;t++) snapshot_step(s,probe_action(),1,0,&tr);
}
static void new_world(Snapshot *s, uint64_t seed) {
    int j=s->world.controlled; double polarity=s->world.polarity;
    uint64_t tick=s->world.tick;
    world_init(&s->world,seed); s->world.controlled=j; s->world.polarity=polarity;
    s->world.tick=tick;
    memset(s->subject.h,0,sizeof s->subject.h); s->subject.previous_action=0;
}
static Errors prediction(Snapshot *s,uint64_t seed, Errors *persistence) {
    unsigned t; Transition tr; Errors e={0,0,0,0};
    new_world(s,seed); probe_rng=seed+UINT64_C(87654);
    for(t=0;t<432;t++) {
        snapshot_step(s,probe_action(),0,0,&tr);
        if(t>=32) {
            add_errors(&e,&tr,s->world.controlled);
            memcpy(tr.predicted,tr.observation.x,sizeof tr.predicted);
            add_errors(persistence,&tr,s->world.controlled);
        }
    }
    return e;
}
static double control(Snapshot *s,uint64_t seed,int learn,unsigned steps) {
    unsigned t; double loss=0; Transition tr; new_world(s,seed);
    for(t=0;t<steps;t++) {
        double d; s->world.target=(t/80)%2 ? -.55 : .55;
        snapshot_step(s,NAN,learn,0,&tr);
        d=tr.next.x[s->world.controlled]-s->world.target; loss+=d*d;
    }
    return loss/steps;
}
static void reverse_belief(Subject *s,int j) {
    unsigned k; s->weights[j][4]=-s->weights[j][4];
    for(k=5+AMOS_H;k<5+2*AMOS_H;k++) s->weights[j][k]=-s->weights[j][k];
}
/* Four lawful histories end at the same sensed position/load, with opposite
 * hidden velocity. Solving the starting position is evaluator-only. */
static unsigned alias_actions(const Snapshot *trained, double *first_step_loss) {
    unsigned side,t,brakes=0; double actions[2]; Snapshot s;
    for(side=0;side<2;side++) {
        World probe; Observation o; Subject mind; Transition tr;
        double command=side ? 1 : -1,offset,pred[3],a; int j=trained->world.controlled;
        s=*trained; s.world.pos[0]=s.world.pos[1]=0;
        s.world.velocity[0]=s.world.velocity[1]=0; s.world.load=0;
        probe=s.world;
        for(t=0;t<4;t++) world_step(&probe,command);
        offset=-probe.pos[j]/pow(.94,4);
        s.world.pos[j]=offset; memset(s.subject.h,0,sizeof s.subject.h);
        s.subject.previous_action=0;
        for(t=0;t<4;t++) snapshot_step(&s,command,0,0,&tr);
        /* Snap roundoff only: analytic endpoint is zero. */
        s.world.pos[j]=0; world_observe(&s.world,&o); mind=s.subject;
        subject_observe(&mind,&o); a=subject_action(&mind,&o,0,0);
        actions[side]=a;
        if(a*s.world.polarity*s.world.velocity[j]<0) ++brakes;
        subject_predict(&mind,a,pred); world_step(&s.world,a);
        *first_step_loss+=s.world.pos[j]*s.world.pos[j];
    }
    return brakes+(actions[0]!=actions[1] ? 4U:0U);
}
static unsigned intervention(const Snapshot *trained,uint64_t seed) {
    unsigned t,changed=0; Snapshot s=*trained; Transition tr;
    new_world(&s,seed); probe_rng=seed+777;
    for(t=0;t<100;t++) {
        Subject original,wrong; Observation o; double a,b;
        world_observe(&s.world,&o); original=s.subject;
        subject_observe(&original,&o); wrong=original;
        reverse_belief(&wrong,s.world.controlled);
        a=subject_action(&original,&o,.4,0);
        b=subject_action(&wrong,&o,.4,0);
        if(a!=b) ++changed;
        snapshot_step(&s,probe_action(),0,0,&tr);
    }
    return changed;
}
static void merge(Errors *a,const Errors *b) {
    a->body+=b->body; a->other+=b->other; a->load+=b->load; a->n+=b->n;
}
static void print_errors(const Errors *e) {
    printf("{\"body_mse\":%.12g,\"external_mse\":%.12g,\"load_mse\":%.12g,\"n\":%u}",
           e->body/e->n,e->other/e->n,e->load/e->n,e->n);
}
int main(int argc,char **argv) {
    unsigned count=32,first=1001,i,m,identified=0,changed=0;
    unsigned negative=0,positive=0,wiring[2]={0,0};
    Errors metrics[3]={{0}},hold={0}; double losses[3]={0};
    double reversed_adapt=0,reversed_frozen=0,unchanged=0;
    double scar_loss=0,clean_loss=0,wrong_scar_loss=0;
    unsigned alias_brakes[3]={0},alias_distinct[3]={0}; double alias_loss[3]={0};
    unsigned scar_ok=0;
    if(argc==2 && !strcmp(argv[1],"--dev")) { count=8; first=1; }
    else if(argc!=1) { fprintf(stderr,"usage: evaluate [--dev]\n"); return 2; }
    for(i=0;i<count;i++) {
        Snapshot model[3],s,changed_body,frozen_body,old_body,future,scar,bad;
        Errors row_errors[3]; double row_loss[3],before_adapt=reversed_adapt;
        double before_frozen=reversed_frozen,before_clean=clean_loss;
        double before_scar=scar_loss,before_bad=wrong_scar_loss;
        unsigned t; Transition tr; uint64_t seed=first+i;
        for(m=0;m<3;m++) {
            Errors e,p={0}; train(&model[m],seed,(int)m,1600);
            s=model[m]; e=prediction(&s,seed+50000,&p); merge(&metrics[m],&e);
            row_errors[m]=e;
            if(m==0) merge(&hold,&p);
            s=model[m]; row_loss[m]=control(&s,seed+60000,0,400); losses[m]+=row_loss[m];
            { unsigned result=alias_actions(&model[m],&alias_loss[m]);
              alias_brakes[m]+=result%4; alias_distinct[m]+=result/4; }
        }
        ++wiring[model[0].world.controlled];
        if(model[0].world.polarity<0) ++negative; else ++positive;
        { double influence[2];
          identified+=(unsigned)(subject_influence(&model[0].subject,influence)==model[0].world.controlled); }
        changed+=intervention(&model[0],seed+70000);
        changed_body=model[0]; new_world(&changed_body,seed+80000);
        old_body=changed_body; changed_body.world.polarity*=-1;
        frozen_body=changed_body; future=changed_body;
        probe_rng=seed+991;
        for(t=0;t<800;t++) {
            double a=probe_action();
            snapshot_step(&future,a,1,0,&tr);
            snapshot_step(&frozen_body,a,0,0,&tr);
            snapshot_step(&old_body,a,1,0,&tr);
        }
        s=future; reversed_adapt+=control(&s,seed+90000,0,400);
        s=frozen_body; reversed_frozen+=control(&s,seed+90000,0,400);
        s=old_body; unchanged+=control(&s,seed+90000,0,400);
        scar=changed_body; bad=future;
        /* Deliberately mislabeled action evidence: equal trace size/data budget. */
        for(t=0;t<bad.memory_count;t++) {
            Transition *r=&bad.memory[(bad.memory_start+t)%AMOS_MEMORY]; unsigned k;
            r->action=-r->action; r->features[4]=-r->features[4];
            for(k=5+AMOS_H;k<5+2*AMOS_H;k++) r->features[k]=-r->features[k];
        }
        if(snapshot_scar(&scar,&future)) ++scar_ok;
        s=changed_body; snapshot_scar(&s,&bad); bad=s;
        clean_loss+=control(&changed_body,seed+100000,0,400);
        scar_loss+=control(&scar,seed+100000,0,400);
        wrong_scar_loss+=control(&bad,seed+100000,0,400);
        fprintf(stderr,"{\"seed\":%" PRIu64 ",\"controlled_channel\":%d,\"polarity\":%.0f,\"body_prediction_mse\":[%.12g,%.12g,%.12g],\"control_mse\":[%.12g,%.12g,%.12g],\"reversal_adapted\":%.12g,\"reversal_frozen\":%.12g,\"scar_clean\":%.12g,\"scar_useful\":%.12g,\"scar_mislabeled\":%.12g}\n",seed,model[0].world.controlled,model[0].world.polarity,row_errors[0].body/row_errors[0].n,row_errors[1].body/row_errors[1].n,row_errors[2].body/row_errors[2].n,row_loss[0],row_loss[1],row_loss[2],reversed_adapt-before_adapt,reversed_frozen-before_frozen,clean_loss-before_clean,scar_loss-before_scar,wrong_scar_loss-before_bad);
    }
    printf("{\"protocol\":\"AMOS-0-v1\",\"first_seed\":%u,\"seeds\":%u,",first,count);
    printf("\"training_steps\":1600,\"prediction_steps\":400,\"control_steps\":400,\"adaptation_steps\":800,");
    printf("\"wiring_counts\":[%u,%u],\"polarity_counts\":[%u,%u],",wiring[0],wiring[1],negative,positive);
    printf("\"prediction\":{\"recurrent\":"); print_errors(&metrics[0]);
    printf(",\"memoryless\":"); print_errors(&metrics[1]);
    printf(",\"linear\":"); print_errors(&metrics[2]);
    printf(",\"persistence\":"); print_errors(&hold);
    printf("},\"identified\":%u,\"belief_intervention_changed_actions\":%u,\"belief_intervention_total\":%u,",identified,changed,100*count);
    printf("\"control_mse\":{\"recurrent\":%.12g,\"memoryless\":%.12g,\"linear\":%.12g},",losses[0]/count,losses[1]/count,losses[2]/count);
    printf("\"aliased_observation\":{\"pairs\":%u,\"distinct_actions\":[%u,%u,%u],\"braking_actions\":[%u,%u,%u],\"first_step_mse\":[%.12g,%.12g,%.12g]},",count,alias_distinct[0],alias_distinct[1],alias_distinct[2],alias_brakes[0],alias_brakes[1],alias_brakes[2],alias_loss[0]/(2*count),alias_loss[1]/(2*count),alias_loss[2]/(2*count));
    printf("\"body_reversal_mse\":{\"adapted\":%.12g,\"frozen\":%.12g,\"unchanged\":%.12g},",reversed_adapt/count,reversed_frozen/count,unchanged/count);
    printf("\"scar\":{\"accepted\":%u,\"clean_mse\":%.12g,\"useful_mse\":%.12g,\"mislabeled_mse\":%.12g},",scar_ok,clean_loss/count,scar_loss/count,wrong_scar_loss/count);
    printf("\"sizeof_subject\":%zu,\"sizeof_snapshot\":%zu}\n",sizeof(Subject),sizeof(Snapshot));
    return 0;
}

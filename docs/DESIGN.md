# AMOS-0 — design fixed before implementation

AMOS — Arianna Method Ontological Subjectivity. Dedicated to Amos Oz.

One C99 source, libc + libm, no pretrained model, no external neural library.
Simulation and subject coexist in one process. The subject's functions receive
observations, never World pointers. This is an experimental operational model
of self/world distinction, prediction of bodily consequences, and continuity
through acquired state. Phenomenal consciousness is not an output metric.

## Dynamics

The world has two bounded scalar positions. One has an inertial actuator, the
other evolves independently. Birth permutes their sensory wiring. The subject
sees two anonymous positions and its bodily load; a target is a task signal.
Neither the controlled-channel index, hidden velocity, nor actuator polarity
is delivered to the subject. Separate world and subject pseudorandom streams.

A small tanh recurrent reservoir encodes observation/action history. It starts
with seeded random connections and zero predictive readout weights. Online
recursive least squares learns action-conditioned predictions of the next
observation, including bodily load. There is genuine learning during life;
zero pretrained parameters does not mean zero numerical parameters.

Readout features include observation, proposed action, recurrent activations,
and action x activation terms. Estimated influence is the difference between
predictions for opposite actions. Planning uses the inferred controllable
channel to approach the target with a cost for predicted bodily load. Its
objective and available actions are engineered, not claimed to emerge.

Recurrent state is not the forecast target: that would permit a tautological
self-prediction. The forecast target is future sensed bodily load, generated
by consequences in the simulation.

## History and time

Immutable birth metadata, separate simulation tick, deterministic RNG state,
neural state, learned readouts/covariance, and a bounded transition memory are
serialized. Optional JSONL provides a full chronological external trace.
The bounded memory contains actual observations, actions, prior predictions,
outcomes, and neural features. It can be replayed as retained future experience.

Exact restoration restores world and subject. Scar restoration restores the
same past world but replays retained later transitions into the subject's
predictor. The scar cannot change birth or the world's past. Complete replay
and scar branching are distinct operations; time coordinates are reversible,
biography is not claimed to be physically reversible.

## Evaluation fixed before results

1. Random-probe experience, then fresh-seed prediction with learning frozen.
   Compare full recurrence, independently learned memoryless features with
   equal readout capacity, and persistence-of-observation prediction.
2. Controlled-channel identification across both sensory permutations.
3. Target control using the acquired model; matched world seeds for controls.
4. Unannounced actuator reversal: compare continued learning with frozen
   pre-change knowledge and unchanged-body reference.
5. Same world/observation, changed acquired action-effect belief: measure
   predictions and action changes. This is an intervention on the model, not
   a change to the body or raw observation.
6. Exact save/resume continuation and deliberate corrupt-state rejection.
7. Past restoration plus future trace: compare clean restore, retained useful
   experience and a same-size action-mislabeled trace. Report any failures.

Validation gates must fail under concrete mutations of the mechanism they
check. A useful recurrent system is required; a memoryless implementation
cannot be reported as successful merely because other properties pass.
Development seeds and final evaluation seeds are separate. Numerical gates
will be recorded before final evaluation. No claim of universal minimality.

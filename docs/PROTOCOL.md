# AMOS-0 evaluation protocol

Design recorded before implementation: DESIGN.md. Numerical gates below were
fixed after development seeds 1–8, before running final seeds 1001–1032.
No model parameters are imported between births. All networks start untrained.

Each birth receives 1,600 random action probes. Three independently learned
models see the same observation/action stream: recurrent (24 tanh units),
memoryless nonlinear (same readout dimension, no temporal input), and linear
(hidden activations zero). This is an external experimental probing schedule;
the ordinary demo explores and chooses its own actions.

The held-out prediction assay uses a different world RNG seed, keeping actuator
polarity and channel wiring unchanged. It warms the recurrent state for 32
steps, then scores 400 novel transitions with learning frozen. The controller
assay uses another world seed and targets +0.55/-0.55 alternating every 80
steps for 400 steps, also with learning frozen. Test physics match development
physics; new seeds are not claims of new environments or arbitrary embodiment.

## Gates

1. Acquired influence identifies the true controlled channel in at least 30/32
   births. Both sensory permutations and both polarities must be represented.
2. Recurrent controlled-position prediction MSE is < 0.10 × independently
   learned memoryless MSE and < 0.10 × persistence-of-observation MSE.
3. Recurrent future bodily-load MSE is < 0.50 × memoryless and persistence MSE.
4. In 32 paired histories with identical current observations, recurrent
   decisions differ in at least 28 pairs and brake the actual hidden velocity
   in at least 58/64 cases. First-step positional MSE is < 0.50 × memoryless.
   Memoryless and linear decisions must be identical within each pair.
5. Flipping ONLY acquired action-effect coefficients for the body channel,
   while keeping world, observation, hidden state and other beliefs fixed,
   changes at least 80% of decisions in 3,200 matched situations.
6. Following an unannounced actuator reversal, 800 new random probes with
   online updates reduce subsequent control MSE to < 0.50 × frozen old model.
7. Replaying at most 128 actual future records into an identical past subject
   reduces average changed-body control MSE to < 0.85 × clean past and
   < 0.85 × equally sized action-mislabeled future evidence.
8. Exact snapshot continuation, causal scar boundary, malformed-file rejection,
   independent world/subject RNG continuity, strict C99 and sanitizer checks.

No required superiority over the linear control in general target tracking:
this simple world may admit a very competitive reactive controller. Report it.
No claim that recurrence is the only possible way to represent history.

## Paired observation experiment

Four lawful actions of one sign, or four of the opposite sign, create opposite
hidden velocities. The evaluator analytically selects initial positions so
both trajectories finish at position zero. The body's load is identical by
symmetry; the external channel follows identical random inputs. At the decision
point the observation vectors and task target are identical. Only history
differs. Neither velocity nor the evaluator's construction reaches the subject.

## Restoration and retained future experience

The body is reversed at the past checkpoint. A future branch experiences 800
steps. Its last 128 transitions retain their original neural context features,
observations and outcomes. Each record is replayed once into the past predictor.
The world's state, both RNG streams, live recurrent state, birth and past clock
remain unchanged. The acquired readout/covariance/update count are the retained
trace. A same-size control flips action signs and their feature interactions.

Exact restore means same binary/build/platform; binary snapshots specify
little-endian IEEE binary64, but cross-platform libm trajectories have not been
tested. No assertion that a checksum protects against deliberate forgery.

## Red controls

Contract suite deliberately drops a restored RNG, replaces scar replay with a
no-op, and copies future world state during scar restoration. Corresponding
gates must fail. The numerical suite is also run on deliberately altered source
with the recurrent core replaced by the independently learned memoryless mode;
prediction and paired-history gates must fail. Final reports retain all seeds,
including regressions. Measurements establish these operational properties,
not a test of subjective experience or a theorem of minimal consciousness.

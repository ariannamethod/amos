# AMOS-0 — measured first body

2026-09-17. Main source: `amos.c`, SHA256
`4c599ec37a4f11a7f5710e93348fc98232125ce8de1e138cd38744f2e5ca0903`.

The first implementation is a single C99 file with a real recurrent network,
online prediction learning, a partly observed simulated body, anonymous sensory
wiring, exact state persistence, and retained future-evidence replay. Its neural
state demonstrably affects predictions and decisions in this environment.

## What was fixed and when

`DESIGN.md` was written before the core. Development used seeds 1–8. The
quantitative gates in `PROTOCOL.md` were recorded before evaluation seeds
1001–1032 were run. Protocol SHA256:
`ea5a15436ddf99c9547ccf872cf2d8399f3d8925bc1d66820051c9eb0641ccb1`.

The final CLI-only addition, `--reverse-body`, exposes the same actuator
intervention already present in the frozen experiment. It did not change
numerical results. The final source was rerun through both suites.

Each birth acquired 1,600 random-probe transitions with zero initial readout.
The probes are an evaluator-controlled experience schedule, not a pretrained
dataset. Recurrent, memoryless nonlinear and linear models were independently
fitted on matched streams. Predictions were then frozen and measured on 400
fresh transitions per seed after 32 recurrent warmup steps. Separate world RNG
seeds were used for ordinary control, belief intervention, reversal, and scar
transfer. Physics and actuator/wiring configuration were held fixed where the
protocol required them. Both wiring permutations occurred (14/18 births), as
did both polarities (19/13).

## Prediction and acquired attribution

Mean squared errors, 12,800 held-out transitions per model:

| Predictor | Controlled position | External position | Own bodily load |
|---|---:|---:|---:|
| AMOS recurrent | 0.000000802973 | 0.000338773 | 0.00000635460 |
| Independently learned memoryless nonlinear | 0.000869424 | 0.000656832 | 0.000157748 |
| Independently learned linear | 0.000841244 | 0.000589916 | 0.000178378 |
| Repeat present observation | 0.00224328 | 0.000584573 | 0.000206177 |

Controlled-channel attribution was correct in **32/32** births. Recurrent body
position MSE was approximately 1,083 times lower than the memoryless nonlinear
control; bodily-load MSE was approximately 24.8 times lower. These are MSE
ratios in a small known-physics world, not general intelligence measurements.

## Identical observations, different histories

For each birth the evaluator constructed two lawful four-action histories
ending at exactly the same sensed positions and load, with opposite hidden
velocity. The external object's random trajectory was identical. Hidden
velocity was never an input to the subject.

| Result | Recurrent | Memoryless nonlinear | Linear |
|---|---:|---:|---:|
| Pairs with different decisions | 32/32 | 0/32 | 0/32 |
| Correct braking actions | 64/64 | 0/64 | 0/64 |
| Next-position MSE around target zero | 0.000747519 | 0.00529507 | 0.00529507 |

Removing temporal neural state loses the distinction. This establishes the
causal value of history in this implementation. An explicit-history linear
estimator was not tested, so neural exclusivity is not claimed.

## Intervention on acquired belief

Only the body-row coefficients multiplying action and action×hidden-state were
sign-flipped. World state, observation, recurrent activations, the other rows,
and action availability were unchanged. Channel attribution uses the magnitude
of influence and therefore was unchanged by the sign flip.

The resulting belief about actuator response changed **3,094/3,200** decisions
(96.69%). Thus the acquired action-effect model is a causal part of selection,
not a description attached after the action.

## Ordinary control and changed body

| Controller | Ordinary target-tracking MSE |
|---|---:|
| Recurrent | 0.0442100 |
| Memoryless nonlinear | 0.0919949 |
| Linear | **0.0410772** |

The linear controller was better on 22/32 seeds and slightly better on average.
Accurate prediction does not automatically make the chosen one-step planner a
better controller. The task is simple enough for a reactive linear solution
to be competitive. This is a retained limitation, not a hidden failed run.

After secretly reversing actuator polarity, 800 new random-probe experiences
were followed by another frozen control assay:

| Model | Control MSE |
|---|---:|
| Updated from new bodily consequences | 0.154204 |
| Old acquired model kept frozen | 1.47531 |
| Unchanged body, same experience budget | 0.0423076 |

New experience reduced error by a factor of **9.57** relative to frozen old
knowledge, improving every seed. It did not fully recover unchanged-body
performance. No actuator sign token was supplied to the subject.

## Restore and scar

Full save/load preserved serialized state and all subsequent transitions,
including world and exploration RNGs. Split CLI runs matched uninterrupted
JSONL and final snapshot bytes. Two zero-step body reversals exactly restored
the original snapshot; a single reversal changed only world polarity.

Scar replay retained up to 128 future transitions, each replayed once through
its original neural context features. Independent tests confirm that it changed
only readout weights, covariance and update count: the historical world, clock,
origin, both RNG streams, live hidden state and old transition ring stayed exact.

The performance assay then tested that acquired evidence on a **fresh world
instance with the same reversed body**, rather than continuing the literal
checkpoint. All three conditions got the same fresh instance:

| Retained state | Control MSE |
|---|---:|
| Clean past | 1.47521 |
| Past plus actual future evidence | **1.14418** |
| Past plus equally sized action-mislabeled evidence | 1.46407 |

Useful evidence reduced mean error by **22.44%** against clean past. There were
29 improvements, one tie and two regressions. The regressions are seeds **1025**
(1.44849 → 1.47189) and **1026** (1.49785 → 1.50288). Small replay is only partial
adaptation; full new experience was much better. All per-seed results remain in
`reports/heldout-seeds.jsonl`.

## Validation and deliberately broken mechanisms

All seven numerical gates passed. Independent contract tests passed with
strict C99 warnings treated as errors, AddressSanitizer and UndefinedBehaviorSanitizer.
LeakSanitizer cannot run under this environment's ptrace; it was not claimed
as passing. Invalid/truncated/tampered/appended snapshots were rejected without
modifying the destination.

| Deliberate defect | Observed failing property |
|---|---|
| Replace normal neural dynamics with memoryless dynamics | Body prediction and history-dependent braking gates fail; own-load and scar gates also fail |
| Lose restored world RNG | Exact restored-state gate fails |
| Turn scar replay into a no-op | Acquired-predictor change gate fails |
| Copy the future world during restoration | Historical-world preservation gate fails |

Tests were authored separately from the core. A separate source review checked
the information boundary, paired histories, belief intervention, and scar
semantics. Neither review nor tests are presented as a consciousness detector.

## Size and timing

Measured with GCC 13.3.0, `-O2 -std=c99`, x86-64 Linux/glibc 2.39:

| Item | Measured value |
|---|---:|
| Main source | 629 lines, 23,472 bytes |
| Optimized executable | 25,920 bytes |
| Subject struct | 30,440 bytes |
| Whole snapshot in RAM | 99,152 bytes |
| Serialized snapshot | 99,176 bytes |
| Peak native-process RSS reported by `/proc/self/status` | 976 KiB |
| Initialization CPU time | 3 μs |
| Online decision + world step + learning + memory | 7.56 μs/step |

Timing covers 20,000 steps and excludes JSON trace I/O and snapshot serialization.
RSS is this instrumented container process, not an estimate for phones or MCUs.
Allocator, stack and standard-library overhead are outside the struct sizes.
No ARM, macOS, microcontroller or cross-libm bitwise-parity result is claimed.
`measure.py` records the full local measurement and is reproducible without
third-party Python packages; timing will vary by host.

## Engineering log and precise limits

- A long linear-control run exposed covariance growth in unused feature
  directions: the old 25,000-step state could no longer be saved. A bounded
  symmetric covariance rescaling fixed the reproduced case. This affects
  adaptation numerics, not the hidden environment.
- Early trace output mixed old predictions with post-update influence. Influence
  is now stored before learning, so the recorded decision evidence is causal.
- Random neural connections remain fixed throughout life. Only 162 readout
  coefficients learn; 2,916 covariance numbers are adaptation state.
- Own-state prediction concerns sensed bodily load and actuator consequences,
  not an introspective prediction of the entire recurrent state.
- Birth is a protected origin coordinate. It is not supplied to the network and
  cannot by itself establish autobiographical subjectivity.
- Acquired neural state carries history into ordinary decisions. Explicit
  episode retrieval occurs only in scar replay; the transition ring is bounded.
- Goals, observation layout, three available actions and physics are engineered.
  The study does not establish spontaneous goals, a complete discovered self
  boundary, phenomenal consciousness, or universal architectural minimality.

The implemented result is a small recurrent neural subject model whose acquired
body expectations and history are measurably involved in its next action.

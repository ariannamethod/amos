# AMOS-2: events, probes, embodiment, three implementations

Protocol fixed before the new implementation. Development births 1–8; new
held-out births 5001–5032. AMOS-0/1 courts remain separate regression courts.
Old `sequence`, `bag`, and `neural` representations keep their meanings. New
`events` is an explicit option, not a silent reinterpretation of old snapshots.

1. Event memory: train 320 six-step trials. Freeze learning. On 96 new trials
   per birth, compare ordinary observation with 1, 2, 4 and 8 additional sensory
   samples during the first landmark. These samples do not advance the world.
   Require at least 95% decisions correct at every delay; report fixed-window
   control on the same births. Also vary landmark dwell in an external harness,
   where elapsed observations and the next cue are independent of agent choice.
   Duration is retained as explicit state; it is not silently treated as a new
   event or assumed irrelevant to every possible world.
2. Neural-only isolation: changing associative means, variance and support must
   change neither neural predictions nor selected actions, including exploration.
3. Exploration: report outcome dispersion and lack of support separately. At an
   otherwise equal decision, an untested action must be preferred to a well-sampled
   noisy action. Repeated noisy evidence must not increase its exploration bonus.
   In a small unknown action/consequence problem, compare active probing against
   neutral choice with the same observation budget. Do not call this a general
   information-gain theorem or promise universal adaptation superiority.
4. Embodiment: two observed channels can both respond to action. Randomize which
   also predicts bodily load. Learn through observations only. Require correct
   attribution on at least 30/32 held-out births, retained through temporary
   interruption of the bodily actuator. Report a matched ambiguous world rather
   than manufacturing certainty when the two channels are observationally equal.
5. Persistence: v1 and v2 loading, exact same-runtime continuation, event durations,
   and scars preserving the past world/live state. Corruption must be rejected.
6. C/Python/JavaScript: shared uint64 PRNG, observations, actions, predictions,
   learning and continuation. Compare forced-action fixtures with tolerance 1e-8;
   decisions checked separately, not inferred from numerical proximity. Python
   and JS remain dependency-free at runtime. Browser shows model computation.

Important gates receive a counterexample or a source mutation which fails them.
The report records limitations and failed approaches. Historical report hashes
remain historical; newly measured reports identify the new source.

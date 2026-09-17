# AMOS-2 implementation notes

AMOS is still one C runtime: `amos.c`, libc and libm. Files around it are
experiments, reference implementations, a browser interface and records.
The user's philosophical README is preserved; this document describes mechanics.

## Events rather than a fixed number of glances

The legacy four-frame sequence is retained as `--glyphs sequence`. The new
`--glyphs events` keeps four event distributions. A sample belongs to the current
event when its nearest acquired prototype is familiar (mean squared distance
at most .025), its winning prototype is unchanged and the event already exists.
Otherwise it starts a new event. Each event has a sample count. Within an event,
the newest soft distribution replaces the old estimate; the recurrent network
still consumes every sample. No world phase or cue identifier enters this test.

Durations are part of persistence and inspection, not yet a learned coordinate
in associative retrieval. Worlds in which duration changes meaning need another
experiment. Four unrelated intervening events can still evict relevant history.
Sensor normalization still assumes that the first sample establishes an origin.
The alphabet still has eight stable prototypes; it does not grow without bound.

The held-out timing court repeats observations of landmarks. Its variable branch
repeats both landmarks by independently drawn counts. These are sensor dwell
samples, not extra transitions of the original six-phase world. The claim is
cadence robustness under that intervention, not invariance to arbitrary physics.

## What uncertainty can motivate a probe?

The field retains the original total uncertainty for compatibility:

    total = sqrt(outcome_variance + 1 / (1 + evidence_support))
    ignorance = 1 / sqrt(1 + evidence_support)
    noise = sqrt(outcome_variance)

Only ignorance receives the exploration bonus. Epsilon-random exploration is
still present; this is a simple support heuristic, not Bayesian expected
information gain. A known noisy action can still be selected randomly, but it
no longer wins the directed bonus because its variance is large. The neural-only
ablation receives neither associative predictions nor associative bonuses.

Tests separate the directed choice from epsilon randomness, then run an eight-
probe discovery court. That court fixes a neutral neural prior and updates the
associative consequences to isolate exploration. It is not a full closed-loop
reversal benchmark, and does not claim universal superiority over random probes.

## Controllable does not automatically mean bodily

`Embodiment` maintains two three-feature online least-squares predictors of
next internal load: `[1, current_load, observed_displacement_squared]`, using
one observed channel per predictor. Predictive errors are accumulated *before*
updates. After at least 32 observations, a relative error gap above 5% permits
an attribution; otherwise `body_channel` returns -1. No true body index is input.

The court makes both objects respond to the same action with independent
perturbations. One object's motion contributes to internal load. The acquired
attribution persists through 200 transitions where that object's actuator is
interrupted. In the matched world where channels move identically, the error
evidence ties and the model abstains. This is a small operational distinction,
not a proof that this particular regression captures every embodiment relation.

This diagnostic currently does **not** choose the action target. Target selection
in the original world retains its controllability rule, keeping that experiment
comparable. Its attribution is available through `amos inspect FILE` and the
in-process `body_channel` function. It can be wrong outside the tested load law;
a permanent body remapping also needs a forgetting/reidentification experiment.

## Time and persistence

C writes AMOS0003. The v1/v2 payload prefix and checksum scheme are unchanged;
a v3 tail adds four event durations and the embodiment predictors. Old v1/v2
states load with the new fields zeroed. Continuation within a version is exact.
Legacy v1 frozen JSON and v2 frozen glyph traces are regression fixtures.
The exploration correction intentionally changes *learning* trajectories when
exploration is nonzero; old learned-policy traces are not promised identical.

A scar transfers acquired glyph prototypes and replays retained future readout /
association evidence. The past world, random streams, live recurrent state,
anchor, event sequence, durations and its bodily error history remain in the
past. Copying future accumulated diagnostic errors would obscure their temporal
meaning; this version deliberately leaves them out of a scar.

Python and JS use the shared `AMOS-JSON-1` format, distinct from C binary snapshots.
It is a complete state representation, including both RNGs, readout covariance,
recurrent activity, glyph evidence, body diagnostics and the last 128 transitions.
Loading validates shape, origin, finite numbers, field names and chronology.
JSON is inspectable but not a tamper-proof scientific record. It has no checksum;
C FNV is likewise a corruption detector rather than authentication.

Seed and RNG values are uint64 hexadecimal strings; numerical computation uses
binary64. JSON counters must fit the JS safe integer range. A C binary↔JSON
converter is not included. Python and JS interchange is tested with both
continuation and scar transfer. No pretrained model is involved in any body.

## Browser laboratory

`web/amos.js` is the standalone model; it also runs under Node for parity tests.
`lab.js` owns UI state. The model never imports the DOM, wall clock, network or
host APIs. Browser timers merely schedule model steps. Rendering reads copies /
outputs and never writes hidden world labels into the subject.

The world panel includes a collapsed observer-only inspection of private law.
The subject panel shows actual hidden activations, acquired event distributions,
pre-consequence forecasts and separate uncertainty components. The biography
retains 128 transitions. Counterfactual scar comparison runs on two copies from
the same past, with learning and random exploration disabled, then reports the
outcomes without declaring that a scar must help.

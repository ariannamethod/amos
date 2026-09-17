> Historical AMOS-1 report. Its measurements and source hash describe that version.
> Current results: [AMOS2_REPORT.md](AMOS2_REPORT.md).

# AMOS-1 — familiar states, uncertain consequences

2026-09-17. One C99 runtime, 932 lines, libc/libm only. Source SHA256:
`833901c4d3ccdcebe4081dd00b930fcba0f493615a0b4ff0a1ee1a90325b929b`.

AMOS-1 adds acquired neural glyphs, approximate recognition, ordered context and
action-conditioned consequence memory to AMOS-0. No pretrained model or corpus
is loaded. The original recurrent predictor, inertial world, autobiographical
ring, origin and scar experiment remain available.

## What the new mechanism actually does

The original 24-unit recurrent network and its online RLS readout remain intact.
In sequence mode, the observed two-dimensional displacement is measured relative
to the first observation, then normalized; bodily load is retained separately.
This view drives both the recurrent dynamics and the network's input projection.
The projection's tanh response supplies the neural signature for glyph matching.
Glyph signatures themselves use the current view; recurrence remains in the
continuous predictor. We do not describe the glyph lookup as another RNN.

At most eight signature prototypes are acquired from experience. Prototypes stay
fixed after allocation so older records retain their meaning. Soft assignment
uses squared-distance softmax. Distance to the nearest prototype is retained
separately: normalizing a distribution must not turn a distant unknown into a
well-recognized state merely because one prototype is the least distant.

Four successive soft glyph distributions form the context. Up to 64 associations
store context, action, mean observed change, outcome dispersion, capped support
and age. Similar contexts share predictions. Recognized, supported evidence
blends into the continuous recurrent forecast. Ordinary inference uses both
mechanisms; no semantic names or correct-action labels enter the subject.

The three recognition quantities are different:

| Quantity | Operational meaning |
|---|---|
| Similarity | Neural-prototype familiarity multiplied by context resemblance |
| Support | Similarity-weighted accumulated evidence, capped at 32 per association |
| Uncertainty | Square root of bodily-change dispersion plus `1/(1+support)` |

Dispersion includes disagreement between matching associations. These scales are
heuristics, not calibrated Bayesian probabilities or guarantees of correctness.
Updates use recent evidence: association means/variances have an exponential
step size once eight observations have accumulated. An old expectation can be
revised while its associated context remains highly recognizable.

The planner anticipates bodily load. During learning, exploration includes both
random actions and a preference for uncertain action consequences. The numerical
repair experiment below uses external random probes; it does not establish a
sample-efficiency benefit of autonomous uncertainty-driven exploration.

## Experiment fixed before held-out births

`GLYPH_DESIGN.md` predates implementation. Development used births 1–8.
`GLYPH_PROTOCOL.md` fixed numerical gates before births 2001–2032; protocol SHA256:
`f99b6630e6dc99e39eac6db54366f75bf3e2e6a45a37b0c66f590a644cc6ef2f`.

Each birth starts without acquired readout weights, prototypes or associations.
Three controls receive the same 320 six-step trials of random actions. Two
anonymous landmarks precede a neutral decision point. Their order, combined
with the counterbalanced birth mapping, determines which action yields load
0.05 rather than 0.95. The subject sees observations and its own actions, never
the hidden order, phase, correct action or world pointer. The evaluator uses
those private values to score all three candidate-action forecasts.

Each scored condition has 96 new trials per birth, with learning frozen.
Both birth mappings occur, 18 negative and 14 positive. The learned alphabets
use four or five of eight available prototypes and 63 of 64 association slots.

## Appearance transfer and temporal order

Transfer changes the sensor offset to (-0.4,0.3), gain to 1.6, and landmark
perturbations from 0.02 to 0.10. A new neutral observation establishes sensor
origin; live recurrent/context state is reset, while acquired parameters remain.
A harder version uses perturbations up to 0.30. These are related numerical
observations, not a test on natural-language or visual concepts.

| Condition | Correct / 3,072 | Accuracy | Bodily-load prediction MSE |
|---|---:|---:|---:|
| Original appearance, new trials | 3,072 | 100% | 0.000153447 |
| Changed appearance | 3,072 | 100% | 0.000339130 |
| Larger perturbations | 3,069 | 99.902% | 0.00840508 |
| Independently learned unordered glyph bag | 1,519 | 49.447% | 0.404853 |
| Recurrent predictor without associative contribution | 2,638 | 85.872% | 0.144408 |
| Swap landmark positions only at retrieval | 0 | 0% | 0.509826 |

Load MSE averages all three candidate actions, not only the chosen one. The
three errors under larger perturbations all occur in birth **2023** (93/96).
No parameter was retuned on that birth.

The retrieval intervention preserves current observation, continuous recurrent
state, learned associations and the multiset of glyphs. Only their positions
change. Its reversed choices show that order participates in this implementation's
forecast and action; the glyph trace is not a decoration added afterward.

## An expectation can be wrong without recognition disappearing

The world secretly reverses the action/consequence relation. The inherited
expectation is still well recognized. New random probes then supply correction.

| State of acquired knowledge | Correct / 3,072 | Load MSE | Similarity | Uncertainty |
|---|---:|---:|---:|---:|
| Old knowledge, changed world | 0 | 0.526556 | 0.99864 | 0.17422 |
| After 12 additional trials per birth | 0 | 0.325372 | 0.99864 | 0.31867 |
| After 120 additional trials per birth | 3,072 | 0.00564479 | 0.99864 | 0.25174 |

Initially every decision is wrong despite high recognition. Early evidence
increases uncertainty before it is sufficient to reverse the decision.
Later all births recover correct decisions, though uncertainty and prediction
error remain above the original stable-world levels. The report retains that
residual uncertainty; recovery is not represented as instantaneous forgetting.

Familiar conflicting experience and unfamiliar perception are also separable:

| Evidence condition | Similarity | Uncertainty |
|---|---:|---:|
| Familiar, stable consequences | 0.99859 | 0.17423 |
| Familiar, independently resampled action mapping | 0.99862 | 0.36950 |
| Unfamiliar opposite-direction landmarks | 0.02593 | 0.77627 |

The conflicting condition receives 200 trials with a fresh hidden polarity
sample per trial. Its subsequent score has 52.93% accuracy; this is not a gate
or evidence of learning an unpredictable mapping. The important observation
is familiar context accompanied by increased outcome dispersion.

## Persistence and original behavior

Snapshots use explicit little-endian `AMOS0002` encoding. The added field,
prototypes, soft context, familiarity and world parameters survive restoration.
The loader still accepts `AMOS0001`; an original snapshot reproduces **all 400
original continuation JSON records exactly**. The in-process sequence test
checks complete restoration and 149 subsequent steps through memory wrap;
the CLI checks an uninterrupted versus split 199-step life, including final
snapshot bytes and decision-time diagnostics.

Frozen mode freezes acquired neural and glyph state while live neural/context
state continues. Scar replay additionally imports compatible acquired prototypes
and replays cached future sequence evidence into the past field. It preserves
the past world, clock, RNGs, origin, observation anchor, live hidden/context state
and old transition ring. Incompatible prototype meanings are rejected without
modifying the past. This tests the extended scar boundary; a numerical benefit
from glyph scars is not claimed here.

All seven original AMOS-0 numerical gates pass in the extended runtime. The
original recurrence ablation, belief intervention and old persistence tests
remain. [AMOS0_REPORT.md](AMOS0_REPORT.md) is the original report; its source
hash and size measurements refer to AMOS-0. Original receipts are preserved in
`reports/amos0-original/`; fresh regression receipts are under `reports/`.

## Validation and deliberate defects

All six new numerical gates pass. C99 warnings are errors in the court;
AddressSanitizer and UBSan pass. LeakSanitizer is disabled in this environment.
The added tests were written in this implementation session; unlike the original
AMOS-0 audit, they are not described as an independent agent review.

| Deliberate mutation | Gate that must reject it |
|---|---|
| Collapse neural signatures to zero | Sequence consequence prediction |
| Remove order from comparison | Sequence consequence prediction |
| Disconnect the associative forecast | Sequence consequence prediction |
| Ignore outcome dispersion | Familiar but uncertain evidence |
| Ignore distance to neural prototypes | Distinguish unfamiliar perception |
| Lose the restored soft sequence | Exact state restoration |

The two uncertainty controls supplement the originally planned three numerical
mutations; no numerical threshold or model parameter changed.
`reports/glyph-verification.json` records actual red results and source hashes.

## Size, timing and concrete limits

GCC 13.3.0, `-O2 -std=c99`, x86-64 Linux; 20,000 steps per mode:

| Item | Measured value |
|---|---:|
| Runtime source | 932 lines; 36,769 bytes |
| Optimized executable | 38,648 bytes |
| Subject state | 53,304 bytes |
| Full world/subject/history in memory | 157,912 bytes |
| Serialized state | 157,960 bytes |
| Inertial mode CPU time per step | 8.35 microseconds |
| Sequence mode CPU time per step | 33.06 microseconds |
| Native peak RSS in these benchmark processes | 1,024 KiB |

Timing excludes JSON and serialization. RAM struct size excludes temporary
serialization copies, stack, allocator and C runtime. No phone, ARM or Arduino
execution is claimed. The acquired alphabet and association table are bounded;
at capacity, the least recently updated association is replaced. This is four
observation steps of context, not arbitrary-length compositional reasoning.

This world admits a hand-built finite-state solution. The experiment establishes
acquisition, transfer within the supplied invariances, causal use of order and
revision of expectations; it does not establish that neurons are uniquely
necessary for this task. The original recurrent body's separate history tests
remain the evidence for the recurrent mechanism's value.

## Engineering record

The first development version normalized soft glyph assignments without keeping
absolute prototype distance. Inspection exposed a novelty problem: a distant
unknown would still have a winning glyph. Absolute familiarity was added before
the final protocol and held-out evaluation. Both prototype distance and outcome
dispersion now have explicit destructive controls.

After the first held-out run, CLI metadata was corrected to identify the new
objective as minimizing load and avoid reporting a controllable landmark index.
No scored decision or prediction changed; both courts were rerun on the final
source. The two additional uncertainty mutations modify only temporary copies.

The bundled CLI example is separate from the fixed court: seed 7 achieves 96/96
after appearance transfer, 0/96 after a hidden reversal, and 96/96 after 120
further exploration trials. Exact commands, full trajectories, snapshots and
summary are under `examples/sequence-*`.

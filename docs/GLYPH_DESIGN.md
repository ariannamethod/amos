# AMOS-1: resemblance has consequences

Design recorded before implementation and before new numerical results.

Keep AMOS-0's recurrent network and original inertial world. Add a bounded
associative memory of short, softly recognized neural state sequences. The
runtime remains one C99 file with libc/libm. No pretrained data or labels.

## Mechanism

An optional sensory view subtracts the first observed position and normalizes
the two-dimensional displacement. This deliberately supplied invariance removes
translation and positive gain; it is not learned visual understanding. Bodily
load stays a separate continuous input. The original world keeps its old view.

The network's input projection supplies a continuous neural signature of this
view. At most eight experience-derived prototypes form a soft glyph alphabet;
there are no English names or hand-authored action meanings. Prototype indices
stay stable once allocated. A four-observation sequence of distributions carries
temporal order. The recurrent state continues to integrate observations/actions
and its learned readout continues to predict consequences.

A small bounded field associates sequence and action with observed changes.
Nearby sequences share evidence. Its outcome estimate contributes to the neural
forecast. Recognition similarity, evidence support and outcome dispersion are
reported separately. These are operational quantities, not calibrated posterior
probabilities. Uncertainty can encourage sampling an insufficiently known action.
Frozen learning must freeze both the learned readout and acquired glyph memory;
live recurrent and sequence states must still advance.

## A second small world

The original body's exceptionally accurate one-step predictor leaves little
room for this extension. Add an explicit sequential task, not a new claim about
performance on that original world. Two anonymous landmarks precede a neutral
decision point. Their order changes which action avoids a subsequent bodily
load. The mapping is counterbalanced at birth. The subject receives observations
only: no phase, order bit, correct action or world pointer. The experimenter may
use those hidden values to score decisions.

Appearance transfer changes offset, positive gain and landmark perturbations.
Same-looking changed causality reverses the action/load relation without notifying
the subject. Neither scenario changes the network's objective: anticipate and
avoid bodily load. The two changes must not be conflated.

## Experiments and controls

Development uses births 1–8. Record numerical gates before fresh births
2001–2032. Retain all per-birth results, including failures.

* Train by consequences, then freeze and measure decisions on new appearances.
* Remove the associative field while retaining the same recurrent predictor.
* Remove order while preserving the same glyphs; also permute only retrieval
  order in a trained subject. This tests whether sequences affect behavior.
* Freeze a learned subject and reverse the world: initially wrong recognition
  should remain possible. With new consequences, measure prediction repair and
  the change in uncertainty. Report delayed/failed recovery.
* Compare an unfamiliar sequence with a familiar sequence whose outcomes
  disagree. Novelty and conflicting evidence are different conditions.
* Intervention on neural signatures must break a gate that actually uses them.
* Exact save/resume, old snapshot loading, frozen learning and scar boundaries
  must cover the added state. Trace predictions must precede updates.

Re-run the original AMOS court. A new successful toy task cannot silently
replace the original recurrent, prediction, restoration or scar properties.
If an approach fails, retain it in the engineering log and revise on development
births. No changes based on held-out births without a new held-out cohort.

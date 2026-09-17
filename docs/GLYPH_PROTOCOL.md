# AMOS-1 numerical protocol

Fixed after development births 1–8 and before births 2001–2032.
GLYPH_DESIGN.md predates implementation. No pretrained state crosses births.

Each of three independently initialized subjects (ordered field, unordered bag,
and recurrent predictor without the field) receives the same 320 six-step trials
of uniformly sampled actions. Neural readout, prototypes and evidence freeze
during scoring. Each condition has 96 fresh trials per birth. Score only the
neutral decision point; all three possible action predictions are evaluated
against the evaluator's law. The private order and polarity never enter Subject.

The world shows rest, landmark A, landmark B, neutral choice, bodily consequence,
recovery; landmark order is randomly reversed. At birth the action mapping is
counterbalanced. Correct action produces load 0.05; other actions 0.95. This is
an engineered finite sequential task, not an open-ended visual environment.

Transfer uses a new world RNG, offset (-0.4,0.3), gain 1.6 and landmark jitter
0.10 instead of 0.02. A harder perturbation uses jitter 0.30. Neutral first
observation establishes the new sensor origin; live recurrent/sequence history
is reset for these transfers, acquired parameters remain. Relative-vector
normalization is an explicit architectural prior. Only bodily-consequence
prediction and action are scored across views, not absolute coordinate forecasts.

## Gates, over all 32 births

1. Both actuator polarities occur. Plain and transformed-view decision accuracy
   >= 95%; transformed-view load MSE < 0.02. Hard perturbation accuracy >= 90%.
2. Transformed-view load MSE < 0.20 times each independently learned unordered
   bag and neural-only control. Report accuracy for those controls as well.
3. Swap the two landmark positions in the retrieved sequence only, preserving
   the current observation, neural state, learned field and glyph multiset.
   Accuracy <= 25%, and load MSE > 5 times ordinary transfer MSE.
4. Unannounced reversal initially gives accuracy <= 25%, while mean similarity
   stays >= 0.90. After 120 new random-probe trials, accuracy >= 90% and load
   MSE < 0.15 times frozen pre-reversal knowledge. Early uncertainty after the
   first 12 trials > 1.30 times frozen uncertainty; final uncertainty < early.
5. Independent random polarity per trial supplies incompatible consequences
   under the same observed sequences for 200 trials. Mean recognition similarity
   >= 0.90, uncertainty > 1.50 times plain familiar uncertainty. This tests
   disagreement in evidence, not novelty. Its accuracy is not a success gate.
6. Frozen observation of two opposite-direction unfamiliar landmarks gives mean
   similarity < 0.30 and uncertainty > 2 times plain familiar uncertainty.
7. Exact state/continuation, frozen acquisition, scar boundary and old-format
   continuation contracts pass; AddressSanitizer/UBSan pass where available.

All results, including per-birth regressions, are retained. Uncertainty is an
outcome-dispersion plus inverse-support scale, not a calibrated probability.
Changed-world repair uses external probing; autonomous exploration is separately
available in the runtime, not what the reversal gate measures.

## Red controls

Run development births on source mutants that (a) collapse neural signatures,
(b) remove ordered comparison and (c) disconnect the field from prediction.
At least the consequence-prediction gate must reject each. A persistence mutant
that loses the restored sequence must fail exact-restoration tests.

Original AMOS-0 gates still run on its original inertial world and defaults.
No claim that a recurrent network is the only possible solution to this task;
an explicitly programmed finite-state machine could solve the two-landmark law.
The learned field is an action-conditioned statistical memory; the neural part
is the input representation and recurrent predictor. It is not called a new
kind of neuron to disguise the statistical part.

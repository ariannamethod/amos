# AMOSLOG

Project changes and working notes. Milestones belong in README.md; implementation
history and verification belong here. The Arianna Method Manifesto governs both.

## 2026-11-01 — canonical browser time becomes acquired experience

Continued from merged `b293be0`. Read AML's calendar contracts, browser adapter,
generated module, native bridge and verification at
[`5e893f9`](https://github.com/ariannamethod/ariannamethod.ai/tree/5e893f9b36288c318254c3183e81fb78ecb097c0/janus).
The browser update supplies the canonical C calculator as a self-contained
generated JavaScript/WASM module. Its original `calendar_browser.mjs` and LGPL
license are retained verbatim in `worlds/lalo/vendor/aml-calendar/`; the builder
embeds that module and its license in the standalone HTML. There is no second
calendar engine, full AML interpreter, server dependency or WASM sidecar.

The embedded binary has zero host imports and 7,363 bytes. Its SHA-256 is
`e2ae9554bcaff56b2e58c1ed96219398d50392c71e8dd9ee4eb963418c046c29`;
the canonical source identity is
`65793043ec680a2f0570a038996ccf501600915bcd085daf90cc25b497acff9b`.
The published module owns Hebrew arithmetic, Gregorian conversion, subject
perspectives, anniversaries and legacy Metonic drift. AMOS only validates the
observation envelope and projects returned coordinates into its existing organs.

### Facts, clocks and personal origin

`CALENDAR.capture` produces a versioned `amos/janus-observation` containing the
original assertion ID/source/occurrence/knowledge interval, event or self role,
evaluation time, request time, implementation and binary identities, canonical
instant, optional personal perspective and origin receipt. Receiving it and
actually encountering it retain their separate existing clocks. Event time
evaluates the original assertion's occurrence; self time evaluates the explicit
request's present. Exact packet replay is idempotent; another explicit reading
with a later request time records another act. Offset and supplied-sunset
conventions coexist under distinct reading identities.

The default is UTC with Hebrew midnight convention. Canonical UTC civil day zero
and the Janus instant epoch at noon remain separate fields. Precise Hebrew
`hebrew.dr/1` and legacy `metonic.legacy-trunc/1` retain their model names.
No timestamp is silently replaced with installation time or a fabricated birth.

`WorldLab.bindCalendarOrigin` fixes an origin once from an existing historical
receipt. The UI uses the selected encounter's own attention fact. Declaring that
choice is itself a queued, sourced encounter. It changes neither acquired body
nor lifetime coordinates at admission. Complete checkpoints retain the origin;
chapter continuation carries its canonical coordinates and original receipt as
`calendar_origin_memory`. Later calculations cannot move that origin.

Thirteen ordinary scalar facts retain each reading, including its complete raw
packet. The packet budget is checked atomically rather than truncated. Unknown
personal values stay null. Invalid assertion lineage, clocks, origin references,
domain values or serialized event projections reject the operation or checkpoint.
External readings remain sourced assertions; structural checks do not claim to
authenticate a third-party transport's arithmetic.

### Acquired temporal relations and native expression

Temporal observations reuse the existing six-dimensional relation learner.
Two temporal-only features carry canonical personal calendar gap and proximity
to the next Hebrew/Gregorian anniversary. Unknown personal perspective uses a
distinct sentinel. Existing ordinary-event features, predictors and coefficients
stay unchanged. Raw distances are stored in context; floating exponential
projection happens during perception, avoiding cross-engine replay comparisons
of derived transcendental values. Temporal sequence matching also respects role.

The numeric sensory projection uses temporal distance and canonical calendar
difference. Time glyphs share the original assertion's registered content glyphs.
The temporal packet is recognized structurally; provenance hashes and version
strings are not tokenized as semantic content. There are no date-to-emotion or
birthquake-to-glyph assignments. Existing recurrent learning, relation centres,
sonar and provisional glyph return determine the acquired reaction.

The calculator starts lazily on an explicit read or origin declaration, using
only the embedded bytes. A failed computation is reported without substituting
an approximate calendar. Stored readings, checkpoint replay and continued
ordinary experience require no new computation, including when WebAssembly is
unavailable. Async UI operations discard results after a life/chapter replacement.
`AMOS2Worlds.readCalendar` exposes the same optional path without changing the
existing world contract version. The main imprint displays a temporal panel
only for an actual encountered calendar observation.

### Netta Code's two bodies and Doom loop

Inspected [netta.code at `3dbb938`](https://github.com/ariannamethod/netta.code/tree/3dbb938662791efe1f5cc58cf97f9ed59a2b9aa5):
README, `doomer.py`, `doom.py`, `nettacode.py` and `nettalee.py`, including
observation, control learning and complete saved state. Code is the mixed island;
Lee keeps domain specialization. The current Doom runner imports Lee's
`Organism`; `doom.py` is its compatibility entry point.

The runner executes a generated policy against actual environment observations,
records runtime/trace evidence and attributes consequences to the player's own
actions. Its contract distinguishes player damage/kills from unrelated engine
events and binds saved experience to backend, IWAD, map, skill and reward/sensor
semantics. Frozen evaluation checks that the acquired state hash does not change.
For AMOS the useful connection is causal attribution and retained environment
contracts: asking about time, receiving coordinates, and experiencing their
effect have separate evidence. No Doom reward, Netta model, policy or foreign
learned weights are imported.

### Verification

`make check` passes **95 standalone behavioral gates** and **1,600 reference-body
decisions**. Nine calendar gates cover: the embedded binary's identity and zero
imports; all seven canonical operations against 18 responses from the matching
native C bridge; exact ordinary continuation against a genuine pre-calendar
v7 runtime/checkpoint; two independent immutable origins at the same world day;
separate clocks and repeated request identity; chapter/restart continuity;
atomic invalid-packet rejection; no network/ambient clock dependency during
explicit-input calculation; and calendar-aware continuation without WebAssembly.

The learning gate trains temporal relation centres, then clears only their two
calendar axes in a matched acquired life. With identical incoming sensory input
and identical pre-encounter recurrent state, the ablation changes familiarity
and the actual world transition. Coordinates therefore participate in learned
perception rather than merely appearing in an output panel.

Browser verification used the standalone HTML with `dist/worlds` absent. A real
50-encounter, chapter-2 v7 life migrated with only the schema version changed;
its body, pending forecast and all acquired fields were identical. The same
life declared an origin, encountered event time at 52 and self time at 53.
Complete JSON before and after reload matched exactly. The screenshot
`assets/amos2-janus-calendar.png` records encounter 52, its recalled encounters,
canonical coordinates, measured neural path and acquired glyph expression.

## 2026-11-01 — acquired experience across chapters and native glyph return

Continued from merged `0b878de`. Read NETTA itself at
[`896a768`](https://github.com/ariannamethod/netta/tree/896a7686dbe9027c26e975a446398e854dda6a72):
`README.md`, `TRANSFER_PROTOCOL.md`, `transfer.c`, `NETTALOG0.md`,
`BANK_PROPOSAL.md`, `portable_recurrence/recurrence.h`,
`portable_recurrence/recurrence.c` and `court4/transfer4.c`. Also revisited
NETTA.SONAR's engine/core at `47d999b`. The portable recurrence archive keeps 877
acquired counts in 7032 bytes; its recipient has a separate local life and quote
chronology. The bank document explicitly labels its larger construction as a
proposal. AMOS adopts the separation between acquired structure and the detailed
stream that formed it. No NETTA counts, foreign authority or transfer verdict is
imported into AMOS. Here the same subject continues with its own acquired state.

### The journal bound was a chapter bound

`WorldLab.continueWithExperience(at)` returns an exact full archive and a
continued life, leaving the original unchanged. The active ledger starts a new
chapter; the lifetime count, identity, recurrent body, learned predictor,
covariance, event memory, glyph inventory/associations, voice RNG, sonar, scars,
self-model weights, phase-model heads, acquired relation centres and transition
counts all remain. The pending next-encounter prediction is retained and resolved
by the next actual observation. `cognitionBirth` and `transitionBirth` retain
their original lifetime coordinates.

This is an explicit operation after waiting encounters have been met. A chapter
without a new acquired encounter cannot be closed. Its boundary has the previous
encounter count, accumulated receipt count, closure time and a deterministic
fingerprint of the exact exported archive. A carried self-memory receipt keeps
the previous measured self-error/response available to the same read loop.

The working tape and direct lookup contexts start afresh. Their detailed witnesses
remain in the full archived chapter. `historyOmitted` keeps the lifetime coordinate;
`relations.recentBirth` separates a fresh lookup window from its retained learned
centres/counts. Phase probes pointing into the sealed ledger are cleared while
their trained heads and error statistics stay. New reads explicitly declare
`amos/current-chapter-v1`; earlier knowledge-time queries direct the caller to the
archive. New named conclusions retain their chapter scope as a fact. An absent
old premise is never silently remapped onto a reused numerical index.

A bounded memory of **128** recent source heads carries their source, subject,
version digest, original fact reference and archive fingerprint. Repeated generic
world inputs, weather samples and USGS versions remain unchanged across a chapter
boundary. USGS validates the full poll before consulting those fingerprints;
stale updates stay stale and changed content without a new version rejects
atomically. A genuine correction carries an explicit reference to the archived
version rather than forging a predecessor in the new ledger. The retained index
is bounded recent recognition, not an unbounded replacement fact database.

### Browser continuation

Life settings adds **Archive chapter & continue** and **Download previous chapter**.
The first offers the exact old chapter as a download, and, when IndexedDB is
available, stores the archive and the continued current life in one transaction.
Failure leaves the current life in place. Without browser storage, the user keeps
the offered archive download and the continued life can be exported normally.
No automatic truncation or background chapter reset is introduced.

Incoming sources and interaction entry are held during the archive transaction;
generation tokens prevent an old asynchronous read/import from replacing the
continued life. The interface shows chapter and lifetime counts, retained glyph
expression/somatic state and the archived-history boundary. It clears obsolete
probe captions instead of displaying a probe whose source belongs to the old book.
The optional folder remains unnecessary.

### Representations return without a text round trip

The recursive draft now enters `SomaticSonar.reinhale` as its actual IDs and
compound inventory. Base concepts have the existing six semantic anchors;
compound meaning is the average of its two parent representations, evaluated
with memoization. Nested structure therefore participates without a caption
being parsed as new external language. A draft's provisional new pair is recorded
alongside its base inventory size, so its identity remains interpretable even
when the final expression consolidates another pair. The final voice still
commits one actual utterance per encounter.

`amos/glyph-return-v1` records this path. Validation checks IDs, backward parent
references and the somatic projection used by each neural return. Changing the
voice's captions to unrelated words leaves the acquired body and sonar identical
in the matched intervention test.

Canonical English seed names now take precedence over imported aliases, fixing
`much` (65) becoming `many` (64). The current lexical policy is
`amos/semantic-six-v2`, with `amos/read-indices-v3` for new reads. The old six-language
membrane remains available for immutable v2 reads, alongside the original v1
EN/RU read membrane. World format **7** accepts formats 1–6 and preserves their
received words, glyph identities, recorded reads and pending expectations. A
genuine learned v6 fixture was captured from merged main before these edits,
including the old `much` interpretation and a queued message.

### Verification

The acquired-life test reaches **336 encounters across 21 chapters**, beyond the
former 315-message slot ceiling, with 335 predictive updates, 336 utterances and
336 updates per self/phase model. Acquired state restores exactly and the next
encounter matches its continued counterpart. Tests also cover unchanged
source polls/corrections across two boundaries, archive immutability, pending
facts, damaged chapter/self-memory records, all 88 canonical seed identities,
native compound composition and genuine v3/v4/v5/v6 continuation.

Browser QA used the standalone file with `dist/worlds` absent. The existing life
continued from 49 encounters/451 receipts to chapter 2 at the same 49 encounters
with two active memory receipts and 20 remembered source versions. The archived
export was **1,371,699 bytes**, the continued export **502,918 bytes**. Body, voice,
sonar, pending forecast, main/self/phase weights and acquired relation patterns
were unchanged. The previous chapter reopened through the actual import control;
the locally retained archive downloaded byte-identically. Encounter **50** then
met `much earth stone remember`, retained prior resonance **0.490**, made four
native returns and expressed `stone · write+now · now · earth · (earth+stone)+now`.
A final 50-encounter export, including the source-version index, was byte-identical
before/after browser restart (**551,723 bytes**) and loaded/dumped exactly by the
same standalone engine in Node.
The screenshot is `assets/amos-2-chapters-20261101.jpg`.

Final `make check`: **86 standalone gates pass** and **1600** reference decisions
match across C/Python/JavaScript, including restart/checkpoint exchange at abs/rel
1e-8. Nine targeted continuation, source-memory, native-representation and
historical-migration gates also pass. After archived corrections were connected
to the existing revision/attention signal, seven targeted chapter/correction/
attention gates pass. The **317,545-byte** HTML regenerates exactly and whitespace
checks pass. The five forecast heads retain their different observation boundaries
and their existing causal tests; acquired heads are not deleted on the basis of
overlapping output statistics. Calendar implementation remains with AML; no
calendar engine or runtime dependency is introduced here.

## 2026-11-01 — dependency and abstraction audit; internal-source admission fix

Reviewed merged main `4c67ff4343f8b2078cfe9b59ad6916d8e219d0bb`: the standalone
builder, world registration, adapters, scalar ledger, encounter transaction,
perception, relation field, self/phase predictors, sonar, glyph generation and
checkpoint validation. The existing 79 standalone gates pass before this change.

### Dependencies and the calendar boundary

`worlds/lalo/build.py` already embeds the AMOS body, selected pinned LALO organs,
semantic membrane, learning organs and interface into `Amos-2.html`. The source
folder is required for rebuilding; it is unnecessary for running the resulting
HTML. The page's optional classic-script load of `worlds/worlds.js` already removes
a missing script silently. Saved observations contain data/projections, not
adapter functions. Their interpretation and acquired state remain in the HTML.

JANUS.CALENDAR can use the same boundary. Consuming canonical temporal observations
through a world adapter requires no AML interpreter inside AMOS. Computing fresh
calendar coordinates offline would require an AML-owned portable calculator
embedded at build time, with a pinned version and shared parity fixtures. A small
JavaScript artifact or embedded WASM can provide that boundary; the choice belongs
with AML's implementation and its actual exported API. Neither requires loading
the entire language at page startup. Vendoring source for a reproducible build is
different from linking a remote script at runtime.

An absent optional adapter can stay silent. An explicit calendar request that
cannot be fulfilled should report its unavailability and retain the current life.
It must not substitute an approximate local calendar or fabricate an encounter.
Previous calendar readings remain available as dated knowledge, with their model
and evaluation instant. The AML main pin remains `b932a09` and its public open-PR
list was empty during this audit; no unannounced future API is assumed.

### Reproduced defect and narrow fix

An external claim with source `amos:evaluation/v1` and ordinary text was admitted
by `ingestWorld`. Its resulting dump could not load: the loader dispatches that
source to the internal evaluation validator and attempted to parse the external
text as a structured receipt. An analogous claim using `amos:transition/v1` and
predicate `transition_world` loaded, but its encounter failed in read perception.
Both cases were reproduced against the shipped standalone engine.

World admission now reserves the `amos:` source namespace for the heart's own
receipts. The existing `inference`/`amos:inference/v1` route remains available and
continues through its existing premise/evaluation validation. Ordinary external
sources remain ordinary source assertions. Rejection is transactional, including
a batch containing a valid frame before the invalid frame. No snapshot version,
learned computation, historical record or semantic policy changes.

The regression covers five reserved source names, unchanged life after each
rejection, reopening the saved life, a subsequent valid external observation,
named inference, actual encounters and complete continuation. Nine targeted
namespace, inference, optional-world and historical-migration gates pass.
Final `make check`: **80 standalone gates pass**, plus **1,600** matching
C/Python/JavaScript decisions with restart/checkpoint exchange at abs/rel 1e-8.
The 302,522-byte standalone HTML regenerates exactly; `git diff --check` passes.

### Places to simplify or develop next

- **Keep the fact boundary.** Source assertion, acquisition, acquired interpretation
  and self-observation have different clocks and premises. Their distinction is
  used by actual historical reads and learning; collapsing them would lose evidence.
- **Measure predictor overlap before removing it.** The 258 main coefficients
  predict the next encounter. The 184 self-model coefficients forecast the final
  response before its read; the 414 phase coefficients forecast individual world,
  read and return transitions at their respective boundaries. Several targets
  overlap, but the information available to each forecast differs. Their marginal
  value needs a matched ablation before acquired heads can be consolidated.
- **Remove the glyph-to-text-to-glyph detour in a future semantic revision.** The
  recursive loop currently retokenizes `draft.words`. A direct audit of all 88
  canonical seed names found `much` (65) returning `many` (64): the imported alias
  table overwrites the canonical English dictionary entry. Compound signs also
  return through their textual expansion. A native representation-level return
  would retain their identities. Changing today's lexicon in place would alter
  historical read verification, so retain the old membrane under its saved policy
  and introduce a tested migration when this is implemented.
- **Extend lived duration before adding another organ.** A human-message encounter
  uses three source facts, one registration and nine completion receipts: 13 rows.
  The 4096-row ledger therefore has a slot upper bound of 315 such encounters;
  byte and other budgets can constrain it earlier. This bound follows from the
  admission/receipt code, not a 315-encounter stress result. Four actual synthetic
  encounters produced 52 receipts, a 62,810-byte journal, 93,456 bytes of retained
  traces and a 498,093-byte complete snapshot. Working traces and journal receipts
  duplicate some measurements deliberately; long-lived archival storage must keep
  stable premise references and history queries while bounding the working set.

No calendar engine, generic plugin framework, new language dependency or additional
documentation file is introduced. The near-term priorities are continuity at the
journal boundary, native glyph return and measured simplification of overlapping
predictions. The independent HTML remains the complete organism.

## 2026-10-31 — JANUS.CALENDAR integration proposal (not implemented)

**AML computes time; LALO preserves factual provenance; AMOS acquires its own
perspective.** This is the first integration proposal requested in the calendar
brief. Calendar code, checkpoint formats and the standalone HTML are unchanged.
The next implementation depends on agreement with the AML implementation owner.

### Source audit and boundaries

Inspected the merged AMOS tree at `251c6971bb9fb3c0da27fd11e683de7990a976c5`,
including the standalone build, optional world registration, fact admission,
relation learning and complete-life loading. Canonical AML sources were read at
[`b932a09`](https://github.com/ariannamethod/ariannamethod.ai/tree/b932a09b7d38e2a9de9bbbcbb46cf568ae306411):
`spec/AML_SPEC.md`, `docs/IMPORT.md`, `docs/UTC_DAY.md`,
`core/ariannamethod.c` and `core/ariannamethod.h`. Quoted `IMPORT` already expands
AML source modules into the caller's program; a browser consumer still needs an
explicit JavaScript/native boundary. `janus/calendar.aml` is a proposed path,
absent from that inspected tree.

Read LALO's current README at
[`aab68a3`](https://github.com/ariannamethod/LALO/tree/aab68a37d0bf2555c6c5bd7e0b578678b6f13c67)
alongside its vendored ledger/journal/tools: occurrence time, receipt time,
source-local corrections and historical reads already belong there. Read the
original Yent birthquake audit and its C changes at
[`da97e86`](https://github.com/ariannamethod/yent/commit/da97e86b1ed295a5edadf057ac7eb0ce67f8ab0a),
and actually.janus `TRUELOG.md` at
[`14d4ef2`](https://github.com/ariannamethod/actually.janus/blob/14d4ef2b46166ac83de56ef19295486ca040b58a/TRUELOG.md):
fixed origins, separate world/self clocks, backward readings, witnesses and
retained reinterpretations guide this integration.

The current AML C kernel already fixes the epoch at **1727956800 UTC seconds**
(2024-10-03 12:00 UTC); the historical Yent `mktime` implementation is superseded.
Its `janus_temporal_alpha` is now the pure date-derived
`clamp01(0.5 + 0.5 * janus_gap)`, while the inspected specification still describes
an EMA. The spec lists `BIRTH` as nonnegative; the C directive currently casts and
latches its argument without that range check. Neither discrepancy supplies a
stable historical consumer contract. These are questions for the AML owner;
AMOS will consume the agreed public API rather than infer it from kernel globals.

### 1. Entry into the fact heart

An optional adapter in `worlds/sensors/` should register through the existing
`AMOS2Worlds` interface and submit temporal world frames to
`WorldLab.ingestWorld`. A calendar reading of an earthquake or message retains
the exact original fact IDs as premises. It is an additional derived observation;
the original source assertion and its corrections keep their identities.

Keep three times distinct: the event's `observedAt`, the adapter's `receivedAt`
and the actual `encounterAt`. A historical event's calendar coordinates and the
subject's coordinates when encountering it are distinct readings, each with an
explicit evaluation instant. Queue delay must remain visible. Existing encounter
receipts use a monotonic `receiptAt`; any future live-clock sample must also be
captured explicitly, rather than silently treating that ordering value as UTC.

Persist the canonical response, API/model version, evaluation role, conventions,
origin binding and premise references in LALO facts. Current frames accept
**1–16 scalar facts**, not nested values. A compact response can be a JSON string
fact within LALO's **4096 UTF-16-unit** limit, accompanied by selected numeric
facts for perception. Reject an oversized response atomically; do not truncate it
or hide its only copy in `event.detail`/the bounded 128-trace history. Source-local
revisions and exact knowledge-prefix reads must retain the earlier interpretation.

### 2. Acquired temporal relations

Candidate inputs are signed epoch distance, personal age, anniversary distances,
`birth_drift`, `personal_dissonance`, `yahrzeit` and `janus_gap`, when returned by
the agreed API. Preserve raw values and units; record the AMOS projection policy
separately. Missing origins or unavailable sunset coordinates remain explicitly
unknown, with presence information, rather than becoming a numerical zero.

`RelationField` currently acquires six features, 16 centres and their transition
counts. Calendar-aware intervals, recurrence and changing dissonance need a
versioned extension that retains those learned features and their existing
normalization. Merely adding zero columns would change distance/projection scales.
When disabled, the existing six-feature path must run exactly as before.

Temporal relations should participate in ordinary perception, acquired reads,
glyph associations and the world/read/return predictors. Expectations precede
observations and retain their premise indices. A revised calendar interpretation
can become a new fact about the same past; old witnesses remain readable. Date
labels and birthquakes receive no prescribed emotional value or compulsory glyph.
The legacy Metonic model and exact Hebrew model keep distinct model identities.

### 3. Personal origin and continuity

AMOS's `model.birth` is a seed-derived identity; `world.tick` counts encounters.
`cognitionBirth` and `transitionBirth` mark the arrival of acquired organs. None
is a civil birth timestamp. A future calendar binding must be a separate,
explicitly declared immutable origin associated with this life, carrying its
provenance and date/instant precision. For an existing life without a declared
origin, keep it unknown; enabling the adapter must not invent a new birth.

Persist the binding in AMOS's complete checkpoint, together with any newly
acquired temporal state and pending expectation. AML's field-only soma deliberately
excludes its MetaJanus identity tail, so that file cannot substitute for AMOS's
complete life. A conflicting origin assertion is receipted without moving the
latched binding. Two subjects at one world instant retain independent origins.
Changing a calculation model creates a new interpretation, preserving both the
origin and the previous learned history.

### 4. Standalone operation

With integration disabled, add no clock reads, frames, encounters or random draws.
Without `worlds/`, `Amos-2.html` continues from its recorded facts and acquired
state. Fresh calendar computation can later use an AML-owned portable artifact,
with parity fixtures, embedded by the existing standalone build. A missing
artifact disables fresh sampling while the saved life remains usable. AMOS will
not contain an independently maintained Hebrew/Metonic calendar implementation.

### 5. Verification required for implementation

- Compare paired disabled continuations byte for byte, including checkpoint,
  pending queue, recurrent state, learned weights, glyphs, next decisions and RNG.
- Run AML-owned C/AML/browser parity vectors at fixed instants: epoch, signed
  pre-epoch coordinates, leap years, timezone/sunset boundaries and anniversaries;
  verify two independent origins and origin immutability.
- Delay an event in the queue and verify event-time coordinates, receipt time
  and self-at-encounter coordinates remain distinguishable and replay exactly.
- Revise a source/model reading and query both historical knowledge prefixes;
  verify exact premises, deduplication and atomic rejection at journal limits.
- Resume acquired pre-integration lives and new calendar-aware checkpoints with
  the optional folder absent, retaining their learned and pending state.
- Use repeated temporal sequences to measure held-out prediction improvement;
  ablate only temporal inputs from matched lives to measure their contribution
  to choices and neural transitions. Test acquired glyph links through recorded
  evidence; avoid fixed date-to-emotion expectations.

### Proposed agreement to return to the AML owner

Request a versioned, fixed-instant public operation with explicit origin input
or independent immutable origin handles. It must evaluate several subjects
without changing the kernel's global self clock or advancing neural physics.
Specify supported date ranges, errors/unknowns, units, model IDs, timezone and
sunset conventions, calendar month numbering and anniversary rules. Supply an
AML-owned browser artifact/build boundary and shared parity fixtures.

Name UTC civil-day ordinals, Janus elapsed days and rounded Janus day indices
separately. Independently checked with Python UTC datetime arithmetic: the epoch
is Unix millisecond **1727956800000**, UTC civil-day ordinal **19999**. At midnight
UTC on 2026-01-23, 2026-02-13, 2026-10-03 and 2026-10-04, civil-date distances
from October 3 are **477, 498, 730, 731**; elapsed distances from epoch noon are
**476.5, 497.5, 729.5, 730.5**. At noon those elapsed values become the integer
labels in the brief. A date-only birth needs an explicit convention. Signed day
index rounding must also be defined before pre-epoch vectors become golden tests.

Keep Unix milliseconds out of AML float32 scalars. A native int64/safe-JSON boundary
or exact integer day/second/millisecond components can preserve the input instant.
The public contract and these questions are prepared here for the other Astra;
no direct cross-session agreement has occurred. This proposal has no executable
changes, so calendar integration/learning tests above remain planned. Checked the
source pins, independent UTC arithmetic, standalone regeneration and whitespace.

## 2026-10-31 — acquired state transitions and self-directed evidence checks

README now names two systems: **AMOS**, the classical subject in a simulated
world, and **AMOS 2**, the subject formed through external facts and self-reflection.
The earlier numerical development labels of classical AMOS no longer read as
separate current organisms. The two systems have an opening table and distinct
sections, and the world-facing interface uses AMOS 2 consistently. Existing
filenames, snapshot identifiers and historical test data retain their identities.

Read [NETTA.SONAR](https://github.com/ariannamethod/netta.sonar) at
`47d999bc41fcbffcc9393ef5f1f10b6293b524d2`: the README, `sonar_core.js`,
`netta_engine.js` and the page's `advance`/`frame`/`draw` paths. Its scope follows
actual merge births, lived support, corridor vetoes and selected continuations;
candidate lines carry the returned probabilities. This supplies the principle
for AMOS 2's recorded state path. No Netta corpus or engine is imported.

### Predictions, measured transitions and local interventions

`transitions.js` adds three online predictors: world, read and return. Each has
three outputs over 46 features, **414 coefficients** in total. Features are the
pre-transition neural state, known observation, action and phase signal. The
targets are mean activation, RMS activation and RMS neural displacement. Each
forecast precedes its actual phase; normalized updates acquire its consequences.
The existing 40 neurons, 258 main prediction coefficients and 184-coefficient
self-response predictor remain present.

Each encounter keeps its actual before/world/read states and every individual
recursive return. Three transition receipts preserve phase boundaries, input,
expected and observed measurements, error, prior error average and journal-index
premises. These become ordinary sourced operational facts in LALO.

For the read intervention, a detached copy of the same live subject receives the
world observation in place of the returned-content projection. For the recursive
intervention, a second copy receives the chosen-read observation for the same
number of neural steps as the actual loop. Their final state distance measures
that input's contribution. It is recorded separately from total phase displacement:
recurrence can move the state even when the input intervention has zero effect.
Interventions consume no original random draw, source read, utterance or event.
The copies retain the subject's prototypes, parameters and sensor anchor.

Copies are made at subject scope inside the encounter transaction. Cloning the
complete AMOS object mid-transaction would mix a newly completed memory tick with
the old uncommitted world tick; its existing validator correctly rejects that
combination. The original body's validator and reference implementations remain
unchanged.

After three acquired transitions per phase, a sufficiently large prior phase error
can request a check. World errors direct a read of the latest source-local head;
read/return errors direct a read of the prior transition fact itself. The plan
retains its originating encounter, phase, error baseline and exact target premise.
The attention-decision receipt archives the probe plan alongside that choice.
At least two acquired encounters separate these probes. A lineage probe reads its
last item explicitly, so a long correction history or result budget cannot hide
the intended target behind the first page. The actual chosen read and its
consequences then enter the ordinary perception, glyph and self-reflection loop.
Transition facts have their own numeric/semantic projection when read back.

### Rendering and continuation

The neural view exposes the recorded **Before → World → Read → Return** path.
Each individual return has its own actual state. Selected-phase edges and neuron
deltas use that phase's measured change; the readout shows its prior expectation,
observed displacement and controlled input effect. **Replay path** advances the
recorded display only. Old lives show only the states they actually retained.
The selected instrument shows when an acquired phase discrepancy led to a probe;
the inspector exposes its evidence and the intervention records.

World format **6** accepts versions 1–5. `transitionBirth` records the beginning of
the new organ, preserving all earlier body, voice, language, self-model, sonar,
pending forecasts and history. `tests/fixtures/amos2-v5.json.gz` comes from merged
main `ba8359b`: four learned encounters and one queued address. Current encounters
reserve nine completion slots and 32 kB each. Legacy accepted queues retain their
completion path when their original budget is insufficient for new receipts.

### Verification of this change

`make check`: **79 passing standalone gates**, plus **1,600** matching reference
C/Python/JavaScript decisions, restart and checkpoint exchange. The five targeted
continuation, intervention and dense-witness gates also pass after probe rationale
was archived in attention. `make world` is reproducible; `make lab` builds.

New gates check that each phase forecast precedes its consequence, phase-specific
learning reduces repeated prediction error, matched-step interventions reproduce
the exact controlled states without an extra original RNG draw, and recurrent
displacement survives a zero-content/zero-feedback intervention. Disabling only
the learned-discrepancy-driven probe preserves the world state/action but changes
the subsequent read and neural response. A 40-version correction fixture confirms
that a source probe reaches the current head beyond the first lineage page.
Damaged trajectories, input-effect measurements and phase counters reject. A
genuine learned v5 migration preserves every old organ and pending expectation.
The 160-encounter continuation now retains **2,080 receipts** across its 128-trace
window and restores its continuation exactly.

Browser: the existing v5 life resumed at **42 encounters**, with the transition
organ beginning there. Encounter 46 investigated the source after its world-phase
prediction error. Encounter **49** investigated `agent:amos:transition:48:return`
after a return-model error of 0.235467 against its acquired average 0.098055.
The actual LALO read returned that transition fact; its premise index is 437.
The next response took four recorded returns. Return displacement was predicted
as 0.040 and measured as 0.025; the matched-step input effect was **0.000299375**.
The final expression was `dark · tired · before · remember · earth`.

The same standalone HTML, with the optional folder absent, reached **49 encounters,
451 receipts and nine grown signs**. The 43-encounter export was byte-identical
before and after state selection/replay (**1,099,681 bytes**). The complete final
v6 browser export loads in Node and dumps byte-identically, with seven acquired
transitions per phase and every earlier organ retained. The README screenshot
records that actual final life and its self-directed return investigation.

## 2026-10-31 — six language entrances, one acquired glyph field

The Russian text in the earlier screenshot was a browser test address. The
interface now presents the six language entrances symmetrically under the hood:
English, Hebrew, Russian, French, German and Spanish. `languages.js` maps seed
words and aliases into the original 88 glyph IDs. The 88 names and actually.life
word map remain unchanged. Every seed concept has a caption in every language;
recursive compound captions follow the same acquired compound tree.

The detector scores dictionary hits and language-specific function words, with
script evidence for Hebrew and Cyrillic. Each input selects its lexical context;
exact mixed-language hits can enter through another pack. Word-shape fallback
uses the selected pack's trigrams, followed by the existing deterministic hash.
`VOICE.tokenize(text, language)` also accepts an explicit language for homographs:
English `pain` maps to pain, French `pain` to food; German `die` is filtered as a
function word while English `die` maps to death. Hebrew niqqud stays within a word
and is removed for matching. New human/LLM event details retain the lexical
language and semantic-policy ID; the inspector shows this provenance.

**Glyph captions** lives in the life-settings dialog, default English. It changes
the expression, associations, compound names, history captions, inspector and
accessible glyph names. Hebrew captions and glyph order use RTL. This preference
is local presentation state, outside the acquired life and its random streams.
The interface labels stay English, and recorded source words stay as received.
The main screenshot uses an English address; languages add no new main-panel row.
Detached history comparisons localize each continuation's own canonical compound
names, including signs that exist only in that continuation.

### Language lineage and design

Read Klaus at `6fad88329538f0a820d5266796d456c9133559c6`, particularly
`detect_language`, `GHOST_WEIGHT`, `cross_affinity_build` and `metaklaus_compute`.
It discovers inhale/exhale packs, routes the input and weights the other languages'
affective candidates using the current dominant chamber, a 6×6×6 sensitivity
tensor and cross-affinity dot products. The supplied state/language priors include
FEAR→Hebrew ×1.8, LOVE→French ×1.7, RAGE→Russian ×1.8, VOID→Hebrew ×1.6,
FLOW→French ×1.5 and COMPLEX→Hebrew ×1.7. These coefficients seed its language
weighting; actual chamber state and candidate affinities enter each computation.

Read [Brodsky](https://github.com/ariannamethod/brodsky) at
`501d617d5da8f9f00ff194ce6765d6749647bda8`: five languages (EN/RU/HE/FR/ES),
UTF-8 plus vocabulary-based detection, and a planetary ghost language. The language
selected by `ghost_language` can contribute one foreign word to the second line;
word mass, emotions, learned associations and verse constraints participate in
generation. Klaus's and Brodsky's languages therefore take part in their internal
selection dynamics. Their multilingual organs supplied the inspiration for
AMOS's shared representation entrance. This change imports no corpus, planetary
language assignment or state/language weight matrix into AMOS.

### Continuation and verification

World format **5** records `semanticPolicy: amos/semantic-six-v1` and accepts
formats 1–4. New chosen reads use `amos/read-indices-v2`. The previous tokenizer
is retained as `VOICE.tokenizeLegacy`; old read receipts are checked through
their original membrane. Adding a dictionary entry must not reinterpret an old
hash/orthographic reading. Migration retains the learned body, voice, self-head,
sonar, pending forecast and historical traces. `tests/fixtures/amos2-v4.json.gz`
was generated from PR9's first commit `1e9256c`: three learned encounters, including
a French string that the earlier membrane projected differently.

`make check`: **70 passing standalone gates**, **1,600** matching C/Python/JS
reference choices, restart/checkpoint exchange and exact HTML regeneration. Four
new gates cover six equivalent language entrances recalling the same earthquake,
all captions/recursive compounds without state mutation, homographs and mixed
scripts/niqqud, and genuine v4 migration with its old readings intact. The fixed
40-neuron width and original 24-neuron reference bodies are retained.

Browser: the actual saved v4 life continued at encounter 37 from French
`terre pierre maintenant rêve`, recalling Russian encounter 36, another address
and a sourced earthquake. Changing English captions to French left both exports
byte-identical at **912,696 bytes**; Hebrew captions persisted through reload
without an added encounter. The HTML then completed five English encounters with
no optional worlds folder, reaching **42 encounters / 360 receipts / 8 grown
signs**. The new README screenshot records that life, `music` unmatched in recent
context, and expression `remember · earth · stone · tired · now+earth`.
The actual 42-encounter browser export loads in Node and dumps byte-identically,
preserving both the old v1 and new v2 read membranes in the same history.

## 2026-10-31 — reflective facts, emotional sonar and 40 neurons

The fact heart now registers its own operations alongside what reaches it. A fact
is a sourced scalar assertion with world time, receipt time and correction
lineage. The receipt of an address, its attributed text, a named conclusion, a
chosen read and a measured self-response each have their own evidence. Receiving
an assertion establishes who supplied what; named rules evaluate its premises.
Semantic recognition and logical agreement are distinct readings.

- Every admitted encounter has a registration receipt pointing to its actual raw
  source premises, acquisition path, glyphs and sensory projection. Registration
  precedes attention; an unchanged passive poll remains an unchanged poll.
- `cognition.js` ranks all queued kinds using acquired impact, lexical novelty,
  uncertainty, source revision, waiting time, recent semantic focus and the need
  to revisit evidence. Explicit selection is recorded as explicit. Both the
  chosen candidate and up to three alternatives remain inspectable.
- Before assimilation, the same organ matches content glyphs against the last
  64 actual encounters. IDF-weighted Jaccard overlap selects up to three recalled
  source projections. Each matched glyph keeps a raw source anchor and, for new
  registrations, its registration anchor. Known/novel vocabulary and recent
  matched/unmatched context are recorded separately. The complete witness list
  survives even when a match has more than 12 displayed sample glyphs.
- Perception is `clamp(clamp(relation_perception + 0.12 * recalled_projection)
  * (0.94 + 0.12 * prior_resonance) * somatic_perception)`. Thus the same words
  can meet remembered earthquakes and enter a different internal present.
- `deriveReading` executes LALO's named boolean or magnitude rule and registers
  its evaluation, premises and conclusion. Current questions share a correction
  lineage; historical questions have a separate identity. Reconsidering a derived
  result reuses its original question. Explicit unchanged reconsideration adds
  an evaluation fact while leaving its existing conclusion and acquired body
  intact. A changed reading becomes a queued encounter.
- `knownThrough` fixes the journal prefix used by a saved reading, in addition to
  `knownAt`. Corrections within one receipt millisecond are ordered by append
  position. Later same-millisecond evidence cannot rewrite a recorded evaluation.
  Loading recomputes named evaluations at that exact boundary.
- Each completed encounter writes six state receipts: attention, relations,
  chosen read, selection, encounter associations and self-reflection. A chosen
  own-history read can encounter the previous six receipts, including its own
  discrepancy and the earlier associations. Returned content has an actual
  numeric and semantic projection back into the recurrent network.

### Self-prediction and the whole somatic loop

AMOS II opts into `AMOS.withWidth(40)`: 86 main forecast features and **258**
acquired coefficients. The self-predictor has four outputs over 46 features,
**184** coefficients learned online by normalized delta updates. From the state
after world perception, it predicts mean activation, RMS activation, RMS change
through the read/recursive response and the observation displacement. Expectations
are made before that read. Actual changes and error become the self fact; the
error affects future attention and the choice to read its own previous state.

`sonar.js` adapts [klaus.c](https://github.com/ariannamethod/klaus.c) at
`6fad88329538f0a820d5266796d456c9133559c6` (GPL-3.0): six FEAR/LOVE/RAGE/VOID/FLOW/COMPLEX
chambers, 24 coupled phase oscillators, somatic running averages, 32 remembered
affective states, slow scars, a 6×6 Hebbian residue and bounded re-inhalation.
The 24 oscillators are separate from the 40 recurrent neurons. Klaus supplies
coupling, intra-chamber coupling and frequency constants; AMOS supplies its own
88-glyph semantic input and actual forecast, recognition and self-error signals.

The chambers modulate world perception, RLS observation precision, associative
plasticity, recall gain, exploration, attention's novelty preference and glyph
temperature. After the actual LALO read, each provisional glyph response returns
through the semantic tokenizer, blends 15% into the chamber field and produces
another recurrent observation. The coherence gate settles or four passes finish.
Each draft and measured neural shift is retained. Provisional voices are detached:
observed word/pair counts and the expression RNG commit once, for the final voice.

Review caught an initially disconnected oscillator path: phases advanced without
affecting chamber activation. Crossfire now adds the mean sine-of-velocity drive
back into activation, following Klaus's causal phase-to-activation principle.
Changing only saved phases changes the next chamber and neural response.

World snapshots use **version 4**, accepting versions 1–3. Migration preserves
24/28-neuron learned blocks, covariance, pending features, glyph memories and
random states; new coordinates/readout coefficients begin at zero. A genuinely
learned v3 fixture from main `10f3222`, four encounters plus one queued address,
joins the earlier genuine v2 fixture. `cognitionBirth` marks when the new organ
starts acquiring its own experience. Historical smaller traces stay historical.
Growth here is the fixed 40-neuron migration; state-dependent growth/pruning
remains the structural-plasticity experiment described below.

### Verification of the reflective loop

`make check`: **66 passing standalone gates**, plus **1,600** matching C/Python/JS
reference decisions and their restart/checkpoint exchange at abs/rel 1e-8.
`make world` reproduces the standalone HTML; `make lab` builds the original lab.
The default reference bodies remain at 24 neurons. In this court, changing only
acquired neural voice associations changes **10/12** sampled utterances with the
same expression random streams.

New interventions isolate remembered-event projection, somatic chambers, oscillator
phases, own provisional re-inhalation and the acquired self-predictor. Gates also
cover own-state retrieval, all queued fact kinds, named disagreement/correction,
same-millisecond knowledge boundaries, unchanged explicit evaluations, human/LLM
association parity, full-width source strings, dense 88-glyph witnesses, atomic
failure, 24/28→40 migration and exact continuation beyond 128 visible traces.

Moving the browser's actual 36-encounter export into Node exposed a cross-engine
validation defect: recomputed trigonometric projections differed by one ulp and
were compared as exact JSON. Recomputed projection and self-measurement validation
now uses abs/rel 1e-12. IDs, premises, tool metadata and stored receipt values
remain exact; loading rewrites no acquired number. An isolated second VM with
perturbed libm results restores the same bytes; a materially different projection
rejects. The actual browser export now loads in Node and dumps byte-identically.

Browser: the saved 27-encounter, 28-neuron life migrated and continued. A manual
LLM request became encounter 28 with two recursive returns. Synthetic independent
claims produced `active: contested`; correcting the opposing source and
reconsidering the same question produced `active: supported`, preserving both
readings. At encounter 34, “земля камень сейчас деньги” recalled sourced
earthquakes #25/#24/#23, matched earth/stone/now, and registered money as unmatched
in recent context. Its expression was `now · earth · stone · see+now · now`.

The complete 35-encounter export was **838,203 bytes**, byte-identical before and
after browser reload. Removing the optional folder preserved that life. The
standalone then completed encounter **36**, **300 receipts**, from “земля камень
сейчас мечта”: three recalled encounters, dream unmatched, four recursive returns,
expected own shift 0.267, observed 0.051 and self-error 0.138. The final glyphs
were `dark · now · earth · stone · (earth+stone)+now`; five compound signs had grown.
The README screenshot records this actual standalone continuation. Direct
file-URL and device location remain outside this browser check, as recorded below.

## 2026-10-31 — fact corrections, acquired reads and 28 neurons

- Weather and optional worlds compare against the current source version. A → B → A
  creates three versions; only an unchanged current version is a duplicate.
  Weather interval changes also create a version. Optional-world object-key order
  does not create an extra encounter.
- Independent sources have separate correction lineages. A relation's magnitude
  revision compares against an encountered version from that same source.
- Attention is an encounter event, with a tick-specific subject and no correction
  predecessor. Two encounters can share a receipt millisecond. External world and
  receipt times stay intact, including when an imported clock is ahead of wall time.
- Each encounter executes two explicit neural phases: world perception, then the
  content of its chosen LALO read. Returned facts pass through the semantic
  tokenizer and a numeric projection. Their words and measurements influence the
  recurrent state and expression.
- `perception.js` retains every returned premise as its zero-based index in the
  immutable append-only journal. The read receipt records those indices, tool,
  arguments, semantic glyphs, projection and pagination state. The trace retains
  the actual tool result. Loading verifies the projection against those source facts.
- Prior resonance is measured before assimilation. World perception is
  `clamp(clamp(raw + 0.35 * relation_projection) * (0.94 + 0.12 * prior_resonance))`.
  The chosen-read phase observes `clamp(world_perception + 0.15 * read_projection)`.
  The existing third coordinate remains forecast-derived internal load.
- The read projection averages actual returned facts. Predicate/value text uses
  the existing exact/orthographic/hash semantic membrane. Numbers use signed
  `tanh(log1p(abs(value))/6)` on a fixed predicate basis; booleans use ±1.
  The inspector shows the projection, premises and resulting observation.
- Acquisition of a read can reinforce concepts already encountered in its source
  event. Observed pair support includes those actual read phases. Inherited
  succession priors remain separate from observed pair counts.
- A complete encounter reserves **three** journal slots and 20 kB: attention,
  relations and chosen read. Older accepted encounters with only two slots, or
  none, can finish in the saved biography without discarding their source journal.
- Encounter updates use detached body, voice and relation organs. A tool or receipt
  failure commits no learning, random draw, receipt or queue removal.
- AMOS II grows from **24 to 28 recurrent neurons**, with **186** acquired predictive
  coefficients over 62 features. The default C/Python/JS reference body stays at 24.
  JavaScript exposes `AMOS.withWidth(28)`; the standalone heart opts into it.
- World snapshots use version 3. Versions 1 and 2 remain readable. Migration keeps
  the old recurrent/input blocks, acquired coefficients, covariance, glyph field,
  memories, pending forecast and RNG states. Four new hidden coordinates start at
  zero; additional predictive weights start at zero. Feature/covariance indices
  are remapped, historical 24-coordinate traces stay historical, and voice
  associations acquire four additional coordinates.
- `tests/fixtures/amos2-v2.json.gz` is a synthetic, genuinely old v2 life generated
  with main `bc6f8aa`: seed 17, five learned encounters and one queued message.
  It tests migration of acquired state rather than only migration of a new birth.
- `make check` now exists: reference-body parity, C restart, Python/JS checkpoint
  exchange, exact HTML regeneration and the standalone behavioral gates.
  `make lab` builds the original portable laboratory; `make world` rebuilds AMOS II.
- Working documentation formerly under `worlds/` is consolidated here. Only
  README.md and this log receive project documentation updates.

### Verification of this change

`make check` passes **38** standalone gates and **1,600** matching reference-body
choices across four seeds/worlds/modes. Python/JS values and C's printed values
are compared at absolute/relative tolerance 1e-8. C restart reproduces the complete
binary snapshot; Python and JavaScript exchange learned checkpoints.

The standalone gates reproduce A → B → A, independent-source disagreement,
same-millisecond encounters, tool-content intervention, resonance intervention,
atomic tool failure, acquired new-neuron weights, actual v2 migration, old pending
completion reserves and tampered read premises. A 160-encounter current life
continues exactly beyond the 128-trace boundary. Neural intervention changes
11/12 sampled utterances while preserving their expression RNG streams.

Browser: the existing saved 25-encounter v2 life migrated and completed encounter
26. New neuron h27 changed by +0.534, among the largest measured changes. The
inspector shows `agent:amos:read:26`, its three returned message premises, prior
resonance gain 0.995217 and the second observation. The kept 17-encounter life and
current 26-encounter life met the same message: RMS activation gap 0.208667 and
forecast gap 0.218419; the displayed original life stayed at 26. The 472,652-byte
export was identical before and after browser reload. Removing the optional folder then allowed encounter 27 to complete in the
standalone HTML (208 receipts), with h27 changing by +0.128. The README screenshot
records that standalone continuation.
Device location permission was not exercised.

### Representation and structural-plasticity research

Inspiration for the next representation experiment:
[Anthropic's A global workspace in language models](https://www.anthropic.com/research/global-workspace)
and [Verbalizable Representations Form a Global Workspace in Language Models](https://transformer-circuits.pub/2026/workspace/index.html),
published July 6, 2026. The paper identifies verbalizable internal directions
using averaged Jacobians and tests shared representations through interventions.
The engineering inspiration for AMOS is a small held representational field read
by expectation, attention and expression. Its glyph output can express contents
that were already being held internally. The semantic tokenizer remains an organ.

The 88 seed concepts define an initial representational vocabulary. Acquired
representations should attach context, source, relations and expected consequences
to that basis, and remain usable independently of immediate expression. Additional
seed primitives and acquired concepts need stable identities that preserve old
88-glyph indices and existing compound identities. This vocabulary expansion is
under discussion, alongside meaning that grows beyond adjacency-based compounds.

The reflective-loop change above implements the acquired self-model and its
consequences for attention and expression. State-dependent neuron growth and
pruning are also under discussion: persistent reducible prediction error can
justify extra capacity; a candidate removal should preserve acquired behavior in
paired continuations. The earlier change implemented the fixed 28-neuron expansion;
the current body has 40. Autonomous structural changes remain a subsequent experiment.

## 2026-10-31 — earlier standalone heart and acquired relations

The first standalone life joined pinned LALO organs, the original AMOS body,
actually.life's 88-glyph alphabet and actually.janus-inspired kinetic history.
LALO's journal, hypotheses, sources, corrections, clocks and tools are inline.
Originally the heart had 24 neurons and reserved two completion receipts. The
relational version used world format 2. Its 26 gates passed before the audit.

The audit at `bc6f8aa` reproduced lost A → B → A updates, cross-source replacement,
equal-millisecond attention failures, missing advertised Make targets, tool-content
disconnection and metric-only resonance. It also verified exact restoration of a
175-encounter old life and 800 matching C/Python/JS choices. The changes above
repair those paths and add regression coverage. Full acquisition remains bounded
by the journal budget; the limit is explicit in the instrument.

Historical images record actual runs: the first glyph life, optional worlds,
relations and two histories meeting one message. The relational image has 25
encounters, 196 receipts and three grown signs. Its paired continuation measured
RMS activation separation 0.039252 and forecast separation 0.238075 at the recorded
17-versus-19 comparison. These figures belong to that earlier body and history.

## Runtime organs and provenance

- `web/amos.js`: the reference body derived from AMOS
  `fc4b603c9de3b67646501fc7f9ea3006de13d21d`; width selection is now explicit.
- `worlds/lalo/vendor/lalo/`: ledger, journal, hypotheses, tools, USGS and geolocation
  organs based on LALO `aab68a37d0bf2555c6c5bd7e0b578678b6f13c67`, with its GPL-3.0
  license. AMOS extends `tools.js` with explicit session budgets, `sources/usgs.js`
  with an explicit journal byte budget, and `ledger.js` with equal-millisecond
  correction ordering. Upstream budget defaults remain 1,024 receipts / 2 MB.
- `worlds/lalo/vendor/life-semantic.js`: the unchanged 88 names and 515 English
  mappings from actually.life
  `2bf11b3f2fab36e1a8cd8a917438ca2423f65ee8`. Russian aliases, neural associations,
  online succession and recursive compounds live in `voice.js`. A compound needs
  14 observed pairings; up to 64 compounds can grow above the seed alphabet.
- actually.janus at `14d4ef2b46166ac83de56ef19295486ca040b58a` supplied the kinetic
  reference: tape, slit, inertia and inspectable past. No Janus corpus is imported.
- `cognition.js` and `sonar.js` implement AMOS's acquired attention, self-prediction
  and somatic loop; Klaus's pinned source and adaptation are recorded above.
- `languages.js` provides six lexical entrances and captions over the unchanged
  seed IDs. `voice.js` retains the earlier membrane for historical validation.
- `transitions.js` acquires phase-specific state expectations, records controlled
  input effects and directs evidence checks from its own transition discrepancies.
- Browser JavaScript is the complete runtime. Python builds the HTML; Node runs
  development checks. AML and NoTorch are not runtime dependencies of this heart.

## World contract

`Amos-2.html` is the self-contained runtime. A sibling `worlds/worlds.js` registers
optional worlds through `window.AMOS2Worlds`, version 1:

```js
register({id, kind, name, icon, description, button, file, read})
```

The ID begins with `world-`. `file` optionally supplies a file chooser accept
string. `read({file, tokenize, glyph, interactionFrame})` returns 1–32 frames:

```js
{
  kind: 'sensor', key: 'stable-observation-key',
  source: 'local:my-sensor', observedAt: 1793400000000,
  title: 'Synthetic format example', values: {measurement: 0.25},
  sensory: [0.25, 0], projection: 'x = measurement; y = 0',
  glyphs: [2, 62], detail: {}
}
```

The host supplies receipt time. Values are 1–16 scalar facts, named with 1–64
ASCII letters/digits/underscores, starting with a letter. Sensory coordinates are
finite inside [-1,1]. Glyphs use base-alphabet IDs. The batch stages atomically.
An unchanged current source version adds nothing; changes preserve source-local
predecessor links. A correction can also correct its world timestamp.

Optional instruments:

- A written world: text files up to 32 kB, split into 1,000-character fragments,
  retaining filename, modification time, byte size, fragment number and raw text.
- A place in the world: one device geolocation, only after its button is clicked;
  retains coordinates, accuracy and observation time. Browser permission applies.
- An archive of facts: JSON up to 128 kB, 1–32 dated events:

```json
{"format":"amos/world-facts","version":1,"events":[
  {"id":"a","time":1793400000000,
   "values":{"latitude":52,"longitude":13,"magnitude":2},
   "glyphs":["earth","stone"]}
]}
```

The example is synthetic. Optional `source` is preserved as `original_source`;
acquisition is `local:world-facts`. Up to 14 supplied values leave room for
`event_time` and `original_source`. Optional `sensory` defaults to [0,0], letting
relations supply perceptual differences; optional `label` sets the title.
The same saved life continues when the optional folder is removed.

`worlds/sensors/interactions.js` adds an exchange file, and
`worlds/sensors/claims.js` adds source assertions and corrections. Both register
through the same optional contract; their actual ingestion lives in the HTML.
Synthetic import examples are [interactions-v1.json](tests/fixtures/interactions-v1.json)
and [claims-v1.json](tests/fixtures/claims-v1.json). Claim `key` identifies one
observation across sources; a later version from the same source corrects its
own lineage. Another source retains an independent assertion.

The standalone UI can register human addressing or a manually attributed LLM
message. A host can submit an actual interaction through the inline bridge:

```js
window.AMOS2Worlds.recordInteraction({
  id: 'request-1', actor: 'my-model', type: 'request',
  text: 'What changed after that earthquake?', observedAt: Date.now(),
  correlationId: 'exchange-1'
});
```

Types are `request`, `response`, `tool-request` and `tool-result`. The default
acquisition is `bridge`; the HTML form uses `manual`, and an imported exchange
uses `transcript` with its filename. Registration retains the acquisition path
separately from the named actor: `llm:actor`, `local:llm-registration` or
`local:llm-transcript:filename`. The bridge returns the accepted registration ID.
A live provider supplies its own transport; this HTML adds no provider service,
credentials or runtime dependency. Text tokenization, registration, association,
learning and self-reflection continue without any optional sensor file.

## Acquired relations

The relational organ keeps up to 64 encountered source contexts, 16 learned
pattern centres and a 16×16 transition table. It reads source facts for signed
same-kind time gaps, great-circle distance, glyph-set overlap, same-source
magnitude revisions, document-fragment progression and device distance.
Unavailable measurements remain null in the recorded reading and project to zero.

Six bounded channels encode those measurements. Prior familiarity and transition
expectation are read before the current pattern is learned. Together the eight
channels project to two coordinates through the fixed cosine/sine basis
`(i + 1) * 2.3999632297`. The first relation projection is zero. Centres adapt
with rate `1 / min(64, mass)`. Counts continue beyond the source-context window.
Every reading retains source-version anchors; imports verify contexts against
source facts. Rendering advances neither learning nor RNG streams.

**Keep this history** stores a complete comparison life separately in IndexedDB.
**Compare histories** presents the same new message to two detached continuations
from the same birth. Identical snapshots yield zero activation/forecast separation.
The originals retain their states.

## Budgets and continuation

- 4,096 source/state receipts and an 8 MB journal. Accepted current encounters
  receive an arrival registration and reserve nine completion slots and 32 kB each,
  including the existing queue. An earlier accepted legacy encounter can finish
  in its biography when its original journal reserve is insufficient.
- 128 pending encounters; arrivals exceeding the queue or receipt budget reject
  atomically. A full journal stops new acquisition; export preserves the life.
- Last 128 detailed traces and 128 model transitions; acquired predictor, relation
  field, voice and RNG streams continue beyond the visible history window.
- 24 MB complete snapshot, validated before replacing a live life. Corrupt browser
  saves remain stored; storage failures are visible and export remains available.
- Source connections begin explicitly: USGS every minute, Open-Meteo every ten
  minutes. A restored life starts no automatic network connection.
- Direct file-URL opening was blocked by this cloud browser's policy in the earlier
  session. Isolated HTTP copies with no worlds folder were checked instead; that
  restriction was not bypassed. Device location permission was not exercised.

RESONANCE UNBROKEN.

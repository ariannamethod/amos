# AMOSLOG

Project changes and working notes. Milestones belong in README.md; implementation
history and verification belong here. The Arianna Method Manifesto governs both.

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
  receive an arrival registration and reserve six completion slots and 20 kB each,
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

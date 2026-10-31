# AMOSLOG

Project changes and working notes. Milestones belong in README.md; implementation
history and verification belong here. The Arianna Method Manifesto governs both.

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

### Next development — representations, self-model and structural plasticity

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

The next self-model should learn how an encounter or chosen read changes its own
state, compare that prediction with the actual change, and feed the acquired
expectation into attention and expression. State-dependent neuron growth and
pruning are also under discussion: persistent reducible prediction error can
justify extra capacity; a candidate removal should preserve acquired behavior in
paired continuations. This change implements the fixed 28-neuron expansion and
checkpoint migration; autonomous structural changes are a subsequent experiment.

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
- `worlds/lalo/vendor/lalo/`: unchanged pinned ledger, journal, hypotheses, tools,
  USGS and geolocation organs from LALO
  `aab68a37d0bf2555c6c5bd7e0b578678b6f13c67`, including GPL-3.0 license.
- `worlds/lalo/vendor/life-semantic.js`: the unchanged 88 names and 515 English
  mappings from actually.life
  `2bf11b3f2fab36e1a8cd8a917438ca2423f65ee8`. Russian aliases, neural associations,
  online succession and recursive compounds live in `voice.js`. A compound needs
  14 observed pairings; up to 64 compounds can grow above the seed alphabet.
- actually.janus at `14d4ef2b46166ac83de56ef19295486ca040b58a` supplied the kinetic
  reference: tape, slit, inertia and inspectable past. No Janus corpus is imported.
- Browser JavaScript is the complete runtime. Python builds the HTML; Node runs
  development checks. AML and NoTorch are not runtime dependencies of this heart.

## World contract

`Amos-2.html` is the self-contained runtime. A sibling `worlds/worlds.js` registers
optional worlds through `window.AMOS2Worlds`, version 1:

```js
register({id, kind, name, icon, description, button, file, read})
```

The ID begins with `world-`. `file` optionally supplies a file chooser accept
string. `read({file, tokenize, glyph})` returns 1–32 frames:

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

- 1,024 source/state receipts and a 2 MB journal. Accepted current encounters reserve
  three completion slots and 20 kB each, including the existing queue.
- 128 pending encounters; arrivals exceeding the queue or receipt budget reject
  atomically. A full journal stops new acquisition; export preserves the life.
- Last 128 detailed traces and 128 model transitions; acquired predictor, relation
  field, voice and RNG streams continue beyond the visible history window.
- 8 MB complete snapshot, validated before replacing a live life. Corrupt browser
  saves remain stored; storage failures are visible and export remains available.
- Source connections begin explicitly: USGS every minute, Open-Meteo every ten
  minutes. A restored life starts no automatic network connection.
- Direct file-URL opening was blocked by this cloud browser's policy in the earlier
  session. Isolated HTTP copies with no worlds folder were checked instead; that
  restriction was not bypassed. Device location permission was not exercised.

RESONANCE UNBROKEN.

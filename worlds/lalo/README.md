# AMOS II — a consciousness in the world

LALO comes first: the world happens, a fact reaches AMOS, acquired state changes,
and a glyph expression grows from that state. Human writing is an event in the
same world. The act of addressing AMOS has its own receipt, alongside the text.

Open [`../../Amos-2.html`](../../Amos-2.html). The complete runtime is that one
file. Write something, read Earth or Sky, or connect both sources. The browser
keeps the same life between sessions. Export and import carry the whole life.

**The fact heart lives in the HTML.** LALO's journal, two clocks, provenance,
corrections and named conclusions are embedded organs. The optional sibling
[`../worlds.js`](../worlds.js) adds text-file and one-shot device worlds through
the [world contract](../README.md). The standalone life continues when that
folder is absent, including any experience it previously received from it.

## Organs

- **AMOS:** the existing `web/amos.js`, embedded unchanged from
  `fc4b603c9de3b67646501fc7f9ea3006de13d21d`. Its 24 recurrent neurons, acquired
  predictor, ordered event glyphs and random stream live through encounters.
- **LALO:** unchanged ledger, journal, hypotheses, tool host and source adapters
  pinned at `aab68a37d0bf2555c6c5bd7e0b578678b6f13c67`. Imported source and GPL-3.0
  license are in `vendor/lalo/`. Six read tools are embedded. The acquired AMOS
  action selects and executes facts, history or lineage with explicit arguments.
- **actually.life:** the exact 88 glyph names and 515 English mappings from
  `2bf11b3f2fab36e1a8cd8a917438ca2423f65ee8`, in `vendor/life-semantic.js`.
  `voice.js` ports the orthographic mouth, online succession field and recursive
  pair-symbol design into an expression organ. Russian aliases and the neural
  association bridge are added here. A compound requires 14 observed pairings;
  observed pair counts stay separate from inherited succession priors.
- **actually.janus:** kinetic reference at
  `14d4ef2b46166ac83de56ef19295486ca040b58a`: tape, central slit, inertia and
  inspectable history. No Janus corpus is imported.

The runtime uses browser JavaScript. LALO's portable fact/tool organs have no
package dependencies. AML's native action-memory host and NoTorch are separate
upstream organs; this file saves the combined life through IndexedDB and JSON.

## What the world does to AMOS

Arrivals append sourced facts to the two-clock LALO journal and queue complete
encounters. Receiving and experiencing have separate lifetimes. New USGS source
versions and Open-Meteo model samples enter; duplicate polls leave acquired state
alone. An unavailable source leaves an explicit source status.

An encounter carries two bounded sensory coordinates:

| Source | x | y |
| --- | --- | --- |
| Earthquake | `tanh(magnitude / 6)` | `tanh(depth_km / 100)` |
| Modelled weather | `tanh(temperature_c / 30)` | `-tanh(wind_kmh / 40)` |
| Human text | order-weighted mean of glyph basis cosines | order-weighted mean of glyph basis sines |

The third coordinate is internal load: `0.85 * previous_load + 0.15 * previous
forecast_gap + 0.005 * abs(previous_action)`, bounded to `[0,1]`. The forecast gap
is RMS over the two incoming sensory coordinates. A missing earthquake magnitude
keeps its explicit null receipt and projects to zero in the magnitude channel.
Every projection is exposed beside its source receipts in the instrument.

The pending forecast was made before this arrival. Its discrepancy updates the
acquired readout and action/consequence associations; the incoming observation
then changes the recurrent state. The chosen action selects the next available
source class (earth / human presence / sky) and calls a real LALO read tool.
If the preferred class has no queued event, the earliest queued arrival is met.
A direct human submission or queue-item click explicitly selects that encounter.

The trace keeps the incoming fact, both clocks, before/after recurrent states,
largest activation changes, acquired glyph mixture, prior forecast, next forecast,
executed tool and returned receipts. Inspecting an old trace reads its historical
state while the life can continue. The kinetic drawing changes presentation only.

## How the voice is acquired

Each incoming concept acquires associations with the actual recurrent state and
recognized event prototypes. The voice combines neural association, prototype
recognition and observed glyph succession, then draws five glyphs through its
own saved random stream. Source descriptors and selected-tool glyphs provide
material; human messages pass the exact/orthographic semantic membrane.

Resonance is the incoming content's mean acquired glyph mass divided by the
largest acquired glyph mass, measured **before** the current content is eaten.
The evidence panel names that quantity, shows every text-to-glyph route and
separates recognition support, lack of evidence and outcome noise.

Known compounds compress future incoming pairs, so compounds can become parents
of new symbols. Up to 64 additional symbols grow above the base 88. Their names,
neural associations, observed co-occurrences and random stream persist together.

## Storage and continuation

- 1024 source/state receipts, 2 MB journal; a full arrival fails atomically.
- 128 queued encounters; a full queue rejects the whole incoming batch.
- Last 128 detailed encounter traces; the view counts earlier omitted traces.
- The complete acquired model and expression field continue beyond that window.
- 8 MB complete export; imports validate before replacing the live world.
- IndexedDB stores the combined JSON snapshot. A storage failure is visible;
  export remains available. A damaged saved life stays stored for inspection.
- Source connections begin explicitly. Connected USGS polls every minute;
  Open-Meteo every ten minutes. Opening a saved life starts no network connection.

## Build and verify

```sh
python3 worlds/lalo/build.py
node --test worlds/lalo/check.mjs
```

Python is a build tool only; the standalone HTML needs neither Python nor Node.
The behavioral gates execute the exact inline organs shipped in the HTML. They
exercise temporal corrections, prior forecasts, different histories meeting the
same present, pre-assimilation resonance, executed tools, recursive sign growth,
neural-state intervention on expression, complete restart continuation, source
units, budget refusal and damaged imports. Source fixtures are synthetic and
live only in the test file.

The HTML embeds the GPL-3.0 license with its source attribution. Imported source
remains pinned and readable. Bridge and interface implementation: Codex, for
Oleg Ataeff / Arianna Method.

RESONANCE UNBROKEN.

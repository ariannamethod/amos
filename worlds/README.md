# Worlds beside the heart

`Amos-2.html` carries its own fact heart: LALO's journal, both clocks,
provenance, corrections, named rules and tools. It also carries AMOS's acquired
state, the expression field, Earth/Sky instruments and human addressing.
Copy that one file into an empty directory and the core life is complete.

When this folder is beside the HTML, `worlds.js` registers additional worlds:

- **A written world:** a `.txt` file enters as a sequence of sourced fragments.
  Each keeps filename, size, modification time, fragment number and raw text.
- **A place in the world:** one browser location reading, explicitly requested
  with its button; latitude, longitude and accuracy enter the same fact heart.
- **An archive of facts:** a JSON file supplies dated observations, positions,
  measurements and optional glyph names. The core derives and acquires their
  relations; the source file keeps its own order.

Neither world starts collecting on load. The folder adds its instruments when
present. With the folder absent, the core interface continues with its built-in
instruments and raises no missing-world notification.

## An organ's contract

The HTML exposes `window.AMOS2Worlds`, version 1. The entry script calls
`register({id, kind, name, icon, description, button, file?, read})`. `id` starts
with `world-`; `kind` names the event class. `file` is an optional file-chooser
accept string. `read({file, tokenize, glyph})` returns 1–32 event frames:

```js
{
  kind: 'sensor', key: 'stable-observation-key',
  source: 'local:my-sensor', observedAt: 1793400000000,
  title: 'The observation',
  values: { measurement: 0.25 },
  sensory: [0.25, 0], projection: 'x = measurement; y = 0',
  glyphs: [2, 62], detail: {}
}
```

The timestamp above is synthetic format illustration. A live organ supplies
its actual observation time. The host supplies receipt time on arrival.
`values` contains 1–16 scalar facts; `sensory` contains two finite coordinates
inside `[-1,1]`; `glyphs` contains base-alphabet IDs from `glyph(name)`.
The complete frame carries its projection and original facts into the journal.
Fact names use 1–64 ASCII letters, digits or underscores and start with a letter.

The core [relation field](lalo/RELATIONS.md) reads coordinates, magnitude,
document position and clock relations from these facts. It remains in the HTML
when the supplying module is removed.

## A dated world file

**An archive of facts** accepts up to 32 events in a 128 kB JSON file:

```json
{
  "format": "amos/world-facts", "version": 1,
  "events": [
    {"id":"a", "time":1793400000000,
     "values":{"latitude":52,"longitude":13,"magnitude":2},
     "glyphs":["earth","stone"]},
    {"id":"b", "time":1793400060000,
     "values":{"latitude":52.1,"longitude":13.1,"magnitude":2},
     "glyphs":["earth","stone"]}
  ]
}
```

These are synthetic format examples. A real archive supplies its actual event
times and facts. An optional `source` string is preserved as `original_source`;
acquisition is recorded as `local:world-facts`. The host supplies receipt time.
Up to 14 scalar values per event leave room for `event_time` and
`original_source`. An optional `sensory: [x,y]` provides two bounded raw channels;
the default `[0,0]` lets relational coordinates supply the sensory difference.
Optional `label` sets the event title. Glyph strings name the base alphabet.

The host stages and validates the whole batch before accepting it. Identical
receipts add nothing. Changes to the same observation retain predecessor links.
Acquisition, encounter and rendering remain separate. The base AMOS attention
policy retains its three source preferences; other available worlds enter the
queue's ordinary arrival order or are selected explicitly by clicking a receipt.

A saved encounter carries all its values and projections. Its life therefore
continues when this folder is later removed, including what that world already
changed in the acquired model and symbols.

`lalo/` contains the readable implementation, pinned upstream organs, builder
and verification of the standalone heart. `worlds.js` is the optional runtime
entry point. Rebuild the heart with `python3 worlds/lalo/build.py`; editing an
optional world takes effect on the next page load.

RESONANCE UNBROKEN.

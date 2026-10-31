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

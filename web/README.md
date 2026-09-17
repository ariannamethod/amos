# AMOS laboratory

Open `index.html` directly. No install, build, network request or pretrained model
is required. Alternatively, from the repository root:

```
python3 -m http.server 8000
```

Then open `http://localhost:8000/web/`.

`amos.js` is the computational body, independent of the interface. It runs in a
browser or Node. `lab.js`, `style.css` and `index.html` display its real state.
Python's `ports/amos.py` can read and write the same JSON checkpoints.

- Run / Pause / Step controls simulated time, not wall-clock physics.
- Learn controls online updates. A frozen mind still changes recurrent state.
- Reverse changes the world's actuator law without changing the subject.
- Keep this moment retains the complete state in this tab.
- Restore reproduces that past without future knowledge.
- Restore with a scar replays retained later associations into that past. It also
  compares 60 frozen steps of two copies, with zero exploration. The comparison
  does not advance the displayed subject and does not assume a scar helps.
- Export / Import make the life portable. Closing the tab without exporting loses
  that life. There is deliberately no silent persistent storage.

The glyph durations count observations, not seconds. Glyphs and uncertainty are
active in the sequence world. The inertial world uses the recurrent predictor.
Observer-only private physics is explicitly separated from subject observations.

Optional browser verification, from the root:

```
npm install --no-save playwright
npx playwright install chromium
make check-browser
```

These packages are test tools, never runtime dependencies. An existing Chromium
can be selected with `AMOS_CHROMIUM_EXECUTABLE=/path/to/chromium`. Screenshots are
written outside the repository by default; set `AMOS_BROWSER_OUTPUT` if desired.

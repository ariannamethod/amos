# AMOS-2 engineering report

2026-09-17. Based on repository commit
`04a5cdce436128ef9761cb98bb54ee866eed8b43`. C remains one source file.

Current C SHA256:
`47b2bf0a34e4010f239b12f55fab3439e6e5285207d7117bd640be11ae333f5d`.
The author’s README prose is preserved. New text describes implementation,
commands and results. The missing Makefile, design/protocol documents and
historical reports are restored. Test paths now follow the repository layout.

## New experiments

Development births: 1–8. Held-out births: 5001–5032. Each timing condition uses
96 decisions per birth, 3,072 in total. Each representation acquires its own
field from 320 trials before evaluation; learning is frozen during evaluation.

| Extra observations of first landmark | Four observations | Four events |
|---:|---:|---:|
| 0 | 3,072 / 3,072 | 3,072 / 3,072 |
| 1 | 2,446 / 3,072 | 3,072 / 3,072 |
| 2 | 2,247 / 3,072 | 3,072 / 3,072 |
| 4 | 2,132 / 3,072 | 3,072 / 3,072 |
| 8 | 2,168 / 3,072 | 3,072 / 3,072 |
| Both landmarks, independently variable repeats 0–8 | 2,627 / 3,072 | 3,072 / 3,072 |

Repeats are extra sensor samples during landmark dwell, not new physics steps.
This addresses the observed cadence failure. It does not establish recognition
through arbitrary distractors, unknown alphabets or duration-dependent laws.

Neural-only decisions are now independent of associative mean, variance and
support: 0 changed decisions in 960 controlled comparisons. The former
exploration path could depend on this field even though forecasting did not.

Exploration uses lack of support rather than total outcome variance. The
controlled probe chooses the untested action over two familiar noisy actions.
In a separate eight-probe discovery problem, active exploration finds the useful
action on 32/32 births; neutral exploitation finds it on 0/32. The latter court
fixes a neural prior and updates associations to isolate the acquisition loop.
It is not evidence that this heuristic universally outperforms random exploration.

Two controllable channels are distinguished by their predictive relationship to
internal load: 32/32 correct attributions, retained on 32/32 after a 200-transition
actuator interruption. The observationally identical control yields 32/32
unresolved attributions. This diagnostic is inspectable and persistent, but it
does not yet replace the original action policy's controllability rule.

See [events.json](../reports/events.json) and the complete
[per-birth records](../reports/events-seeds.jsonl).

## Gates that actually go red

Temporary source mutations, never applied to the delivered engine:

- Restoring associative steering in neural-only mode breaks isolation.
- Restoring variance-seeking exploration breaks the directed probe test.
- Disabling event coalescing breaks cadence robustness.
- Feeding both bodily predictors the same channel destroys attribution.

Existing recurrence, order, field, familiarity, uncertainty, random-state and
scar mutation tests also still detect their corresponding broken properties.
Both original numerical courts pass unchanged. The existing linear control
still beats recurrence on its original easy target task; this result is retained.

## Persistence and ports

C writes AMOS0003 and loads v1/v2. The old v1 fixture reproduces all 400 frozen
JSON records; the old v2 fixture reproduces all 576 shifted-view frozen records.
The new event state and durations restore exactly through 149 further steps,
including ring-buffer wrap. Scars preserve the past live state and bodily error
history. ASan and UBSan pass the C contract suites.

C / Python / JS comparisons cover 15 combinations of three seeds and five
representations, including uint64 max as a seed. They include 1,920 learned
steps for the long event case. Observations, recurrent state, readout weights,
bodily errors, predictions, PRNG state and sampled policy decisions are compared.
Maximum observed absolute numerical difference: **2.411200128449309e-10**, below
the declared absolute/relative 1e-8 tolerance. Sampled decisions agree exactly.
This is a finite fixture court, not a claim that floating-point trajectories can
never diverge on any platform or near-tie.

Python / JS JSON restart is exact within each runtime. Complete states and
scarred states transfer between them, with subsequent numerical comparisons.
C binary and portable JSON remain separate formats. JSON counters are limited
to the JS safe-integer range. See [ports.json](../reports/ports.json).

## Browser

The actual JS model runs locally in the laboratory. Chromium 153.0.8010.0 checks:
run/pause/step, exact restore, scar preserving the past world, actuator
intervention without subject edits, frozen learning, state export/import,
rejected malformed import leaving the current life intact, and a 390-pixel
mobile layout without horizontal overflow. No page exceptions or runtime
network requests occurred. Desktop and mobile layouts were visually inspected.
The bundled offline HTML separately executed 120 actual model steps without
external requests. Test tooling is optional; browser runtime has no packages.

## Size and timing

The measured x86-64 GCC 13.3 `-O2` build:

| Property | Value |
|---|---:|
| C source | 1,035 lines / 41,457 bytes |
| C executable | 38,648 bytes |
| Complete state in memory | 158,160 bytes |
| C snapshot | 158,208 bytes |
| Subject in memory | 53,552 bytes |
| Native peak RSS | 1,024 KiB |
| Inertial step, 20,000-step run | 11.26 µs |
| Event step, 20,000-step run | 40.88 µs |

Timing includes online regression, choice, world transition and ring memory;
it excludes JSON output and snapshot serialization. These are one-host sample
measurements, not a performance regression claim or an Arduino measurement.
[performance.json](../reports/performance.json) contains compiler, platform and
all modes. Hardware suitability awaits the exact acquired board model.

## Limits retained deliberately

- Four events and eight prototypes remain finite, acquired representations.
- Sample count is retained; duration-dependent semantics are not learned yet.
- The exploration bonus is a support heuristic, not expected information gain.
- Embodiment attribution is a diagnostic tested under a specific load relation.
  Its cumulative error history needs another experiment for permanent remapping.
- The two runtime snapshot formats are not interchangeable without a converter.
- The browser uses in-tab persistence until the user exports a file.
- No Arduino test has been performed and no subjective-experience meter is shown.

No failed held-out seed was removed. Original reports are retained under
`reports/amos0-original/` and `reports/amos1-original/`; current receipts are at
the top of `reports/`. Historical hashes identify their historical source.

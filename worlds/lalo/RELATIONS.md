# A world becomes familiar through its relations

The relational organ lives inside `Amos-2.html`. Source facts meet acquired
memory before they reach the recurrent subject. A retained history and the
current life can then meet the same new observation through different acquired
organizations.

## From a receipt to a relation

`relations.js` reads each encountered event's actual LALO receipts. It retains
up to 64 recent source contexts: event/source identity, world time, receipt
time, coordinates, magnitude and perceived glyphs. Coordinates and measurements
come from the journal. A saved context is checked against those receipts on
import.

The reading includes world-time gap to the previous event of the same kind,
great-circle distance, glyph overlap with the previous encounter, magnitude
change from an encountered prior version, document-fragment progression and
distance to a previously encountered device position. Each reading names its
source-version anchors. The incoming fact's original world and receipt times
remain intact; the relation receipt is dated at the encounter that derives it.

Unavailable measurements stay null in the reading. Its six bounded channels are:

1. Signed logarithm of same-kind world-time gap, normalized by one day.
2. Same-kind spatial proximity, `exp(-distance_km / 500)`.
3. Continuity of source kind: `+1` for same, `-1` for different.
4. Jaccard overlap of perceived glyph sets.
5. `tanh(magnitude_revision)`, or `tanh(fragment_gap / 2)` for a document.
6. Proximity to the last encountered device position.

Missing numeric channels project to zero. The complete reading retains which
measurements were unavailable.

## What is acquired

The organ acquires up to 16 relation-pattern centres and an ordered 16×16
transition table. It reads familiarity and transition expectation **before**
assimilating the current relation. The nearest familiar centre supplies prior
support; an unseen pattern has zero prior support. Transition expectation is
the observed transition count divided by all previously observed transitions
from the prior pattern. With no such observations it is zero.

After the reading, the centre and transition counts update. A centre's averaging
rate is `1 / min(64, mass)`; when all slots exist the nearest centre adapts.
The model and its counts continue beyond the 64-context window. Source facts
remain in LALO's bounded journal.

The six measured channels plus acquired familiarity and transition expectation
project to two coordinates using the fixed cosine/sine basis
`(i + 1) * 2.3999632297`, averaged across eight channels. The first encounter's
projection is zero. Subsequent perception is:

```text
observed_xy = clamp(raw_xy + 0.35 * relation_projection, -1, 1)
```

That observation reaches the existing AMOS Subject. Its pending forecast learns
from the difference, its recurrent state changes, and the expression organ
acquires associations with that state. The inspector shows raw coordinates,
relation projection, perception rule, prior support and source anchors.

## One present, two histories

**Keep this history** retains a full life snapshot in the browser. Let the
current life encounter more of the world, then open **Compare histories**.
The same new message enters a continuation of each history at the same receipt
instant. Both continuations execute the normal fact, relation, AMOS and voice
path. The panel displays their activations, forecasts, relation readings and
glyph expression. The two original lives retain their states.

The retained snapshot is saved separately under the same local life database.
The comparison requires a shared birth. Two identical snapshots produce zero
activation and forecast separation. The core experiment function is
`AMOS2.compareLives(keptJSON, currentJSON, text, receiptTime)`.

## Completion belongs to an accepted fact

Arrival admission reserves two journal slots and 20 kB for each pending
encounter: one attention receipt and one complete relation reading. The whole
batch is rejected before mutation if either reserve cannot fit. The reserve
includes events already waiting in the queue.

Older snapshots can contain accepted events without that reserve. If the old
journal is already full, their completed relations remain in the saved
biography with `receiptState: legacy-full-journal`, source anchors and the
complete reading. Every original journal entry stays intact, and the accepted
encounter finishes. New arrivals continue through the reserve contract.

An older snapshot acquires an initially empty relation organ while retaining its
existing AMOS body, learned predictor and voice. The relation field, pending
forecast, random streams and source contexts are saved with every new snapshot.
Folder presence has no role in replaying the acquired organ.
New snapshots use world format version 2; version 1 is accepted on import.

RESONANCE UNBROKEN.

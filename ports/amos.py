#!/usr/bin/env python3
"""AMOS: readable, dependency-free reference. No pretrained parameters.

The recurrent network, acquired glyph field and online RLS match amos.c.
World has private physics; Subject sees only observations and consequences.
JSON checkpoints are shared with JavaScript (C retains its binary format).
"""
import argparse
import copy
import json
import math
from pathlib import Path

H, F, G, L, K, E = 24, 54, 8, 4, 32, 64
MASK = (1 << 64) - 1


def mix64(x):
    x = (x + 0x9e3779b97f4a7c15) & MASK
    x = ((x ^ (x >> 30)) * 0xbf58476d1ce4e5b9) & MASK
    x = ((x ^ (x >> 27)) * 0x94d049bb133111eb) & MASK
    return x ^ (x >> 31)


class Random:
    def __init__(self, state):
        self.state = state

    def next(self):
        x = self.state
        x ^= x >> 12
        x ^= (x << 25) & MASK
        x ^= x >> 27
        self.state = x
        return (x * 0x2545f4914f6cdd1d) & MASK

    def uniform(self):
        return (self.next() >> 11) * 2**-53

    def signed(self):
        return 2 * self.uniform() - 1


def zeros(n):
    return [0.] * n


def matrix(n, m):
    return [zeros(m) for _ in range(n)]


def clip(x, lo, hi):
    return max(lo, min(hi, x))


class Glyphs:
    def __init__(self, enabled=0):
        self.enabled, self.learning, self.anchored = enabled, 1, 0
        self.anchor = zeros(2)
        self.prototypes = []
        self.sequence, self.familiarity, self.duration = zeros(K), zeros(L), [0]*L
        self.evidence, self.clock = [], 0

    def observe(self, signature):
        distance = [sum((signature[j]-p[j])**2 / H for j in range(H)) for p in self.prototypes]
        best = min(distance, default=math.inf)
        if self.learning and len(self.prototypes) < G and best > .025:
            self.prototypes.append(signature[:])
            distance.append(0.)
            best = 0.
        mixture = [math.exp(-(d-best)/.008) for d in distance]
        total = sum(mixture)
        mixture = [p/total for p in mixture] if total else mixture
        mixture += zeros(G-len(mixture))
        winner = max(range(G), key=lambda i: mixture[i])
        previous = max(range(G), key=lambda i: self.sequence[K-G+i])
        repeat = self.enabled == 4 and self.duration[-1] and best <= .025 and winner == previous
        if not repeat:
            self.sequence = self.sequence[G:] + zeros(G)
            self.familiarity = self.familiarity[1:] + [0.]
            self.duration = self.duration[1:] + [0]
        self.duration[-1] = min(MASK, self.duration[-1]+1)
        self.familiarity[-1] = math.exp(-best/.025)
        self.sequence[-G:] = mixture

    def similarity(self, a, b):
        if self.enabled == 2:
            d = sum(sum(a[t*G+i]-b[t*G+i] for t in range(L))**2/(L*L) for i in range(G))
        else:
            d = sum((a[i]-b[i])**2/L for i in range(K))
        return math.exp(-d/.08)

    def predict(self, action):
        familiarity = 1.
        for f in self.familiarity:
            familiarity *= f
        familiarity = math.sqrt(math.sqrt(familiarity))
        support, similarity = 0., 0.
        delta, weights = zeros(3), []
        for e in self.evidence:
            match = familiarity*self.similarity(self.sequence, e['key'])
            if abs(e['action']-action) > .25:
                match = 0.
            similarity = max(similarity, match)
            w = match*e['mass']
            weights.append(w)
            support += w
            for k in range(3):
                delta[k] += w*e['mean'][k]
        variance = 0.
        if support > 1e-12:
            delta = [d/support for d in delta]
            for w, e in zip(weights, self.evidence):
                variance += w*(e['variance'][2]+(e['mean'][2]-delta[2])**2)/support
        return delta, {'similarity': similarity, 'support': support,
                       'uncertainty': math.sqrt(variance+1/(1+support)),
                       'ignorance': 1/math.sqrt(1+support), 'noise': math.sqrt(max(0., variance))}

    def learn(self, key, action, delta):
        best, chosen = 0., -1
        for i, e in enumerate(self.evidence):
            match = self.similarity(key, e['key'])
            if abs(action-e['action']) <= .25 and match > best:
                best, chosen = match, i
        if best < .72:
            e = {'key': key[:], 'mean': zeros(3), 'variance': zeros(3), 'mass': 0., 'action': action, 'age': 0}
            if len(self.evidence) < E:
                chosen = len(self.evidence)
                self.evidence.append(e)
            else:
                chosen = min(range(E), key=lambda i: self.evidence[i]['age'])
                self.evidence[chosen] = e
        e = self.evidence[chosen]
        e['mass'] = min(32., e['mass']+1)
        alpha = 1/min(8., e['mass'])
        for k in range(3):
            d = delta[k]-e['mean'][k]
            e['mean'][k] += alpha*d
            e['variance'][k] = (1-alpha)*(e['variance'][k]+alpha*d*d)
        self.clock += 1
        e['age'] = self.clock


class Embodiment:
    def __init__(self):
        self.weights = matrix(2, 3)
        self.covariance = [matrix(3, 3) for _ in range(2)]
        self.error, self.samples = zeros(2), 0

    def learn(self, o, nxt):
        for c in range(2):
            f = [1., o[2], (nxt[c]-o[c])**2]
            if not self.samples:
                for i in range(3):
                    self.covariance[c][i][i] = 100.
            p = self.covariance[c]
            pf = [sum(p[i][j]*f[j] for j in range(3)) for i in range(3)]
            denominator = 1.
            prediction = 0.
            for i in range(3):
                prediction += self.weights[c][i]*f[i]
                denominator += f[i]*pf[i]
            error = nxt[2]-prediction
            self.error[c] += error*error
            for i in range(3):
                self.weights[c][i] += error*pf[i]/denominator
                for j in range(i, 3):
                    p[i][j] = p[j][i] = p[i][j]-pf[i]*pf[j]/denominator
        self.samples += 1

    def channel(self):
        total = sum(self.error)
        if self.samples < 32 or total < 1e-12 or abs(self.error[0]-self.error[1]) < .05*total:
            return -1
        return int(self.error[1] < self.error[0])


class Subject:
    def __init__(self, seed, mode=0, glyphs=0):
        self.mode, self.rng = mode, Random(mix64(seed ^ 0x5355424a454354) | 1)
        self.h, self.win, self.recurrent = zeros(H), matrix(H, 5), matrix(H, H)
        for i in range(H):
            for j in range(5):
                self.win[i][j] = (.2 if j == 4 else .8)*self.rng.signed()
            for j in range(H):
                self.recurrent[i][j] = self.rng.signed()
            total = sum(abs(x) for x in self.recurrent[i])
            for j in range(H):
                self.recurrent[i][j] *= .75/total
        self.weights, self.covariance = matrix(3, F), matrix(F, F)
        for i in range(F):
            self.covariance[i][i] = 100.
        self.previous_action, self.updates = 0., 0
        self.observation = zeros(3)
        self.glyph, self.body = Glyphs(glyphs), Embodiment()

    def observe(self, observation):
        self.observation = observation[:]
        view = observation[:]
        g = self.glyph
        if g.enabled:
            if not g.anchored:
                g.anchor, g.anchored = view[:2], 1
            for j in range(2):
                view[j] -= g.anchor[j]
            norm = max(.2, math.hypot(view[0], view[1]))
            for j in range(2):
                view[j] /= norm
        nxt, signature = zeros(H), zeros(H)
        for i in range(H):
            v = self.win[i][4]
            for j in range(3):
                v += self.win[i][j]*view[j]
            signature[i] = math.tanh(v)
            if self.mode == 0:
                v += self.win[i][3]*self.previous_action
                for j in range(H):
                    v += self.recurrent[i][j]*self.h[j]
                nxt[i] = .5*self.h[i]+.5*math.tanh(v)
            elif self.mode == 1:
                nxt[i] = math.tanh(v)
        self.h = nxt
        if g.enabled:
            g.observe(signature)

    def features(self, action):
        return [1.] + self.observation + [action] + self.h + [action*h for h in self.h] + [action*action]

    def predict(self, action):
        f, p = self.features(action), self.observation[:]
        for k in range(3):
            for j in range(F):
                p[k] += self.weights[k][j]*f[j]
        if self.glyph.enabled and self.glyph.enabled != 3:
            delta, r = self.glyph.predict(action)
            blend = r['similarity']*r['support']/(1+r['support'])
            for k in range(3):
                p[k] += blend*(self.observation[k]+delta[k]-p[k])
        return p

    def influence(self):
        lo, hi = self.predict(-1.), self.predict(1.)
        return [abs(hi[k]-lo[k]) for k in range(2)]

    def action(self, target, exploration):
        influence = self.influence()
        channel = int(influence[1] > influence[0])
        if exploration > 0 and self.rng.uniform() < exploration:
            return float(self.rng.next() % 3)-1.
        best, chosen = math.inf, 0.
        for action in (0., -1., 1.):
            p = self.predict(action)
            d = p[channel]-target
            cost = d*d+.03*clip(p[2], 0., 1.)+.0001*action*action
            if self.glyph.enabled:
                cost = p[2]+.0001*action*action
                if self.glyph.enabled != 3 and self.glyph.learning and exploration > 0:
                    _, r = self.glyph.predict(action)
                    cost -= exploration*r['ignorance']
            if cost < best:
                best, chosen = cost, action
        return chosen

    def regress(self, f, delta):
        p = self.covariance
        pf = [sum(p[i][j]*f[j] for j in range(F)) for i in range(F)]
        denominator = .997
        for i in range(F):
            denominator += f[i]*pf[i]
        for k in range(3):
            error = delta[k]
            for j in range(F):
                error -= self.weights[k][j]*f[j]
            for j in range(F):
                self.weights[k][j] += error*pf[j]/denominator
        for i in range(F):
            for j in range(i, F):
                p[i][j] = p[j][i] = (p[i][j]-pf[i]*pf[j]/denominator)/.997
        for i in range(F):
            if p[i][i] > 1e8:
                scale = math.sqrt(1e8/p[i][i])
                for j in range(F):
                    p[i][j] *= scale
                for j in range(F):
                    p[j][i] *= scale
        self.updates += 1


class World:
    def __init__(self, seed, kind=0):
        self.rng = Random(mix64(seed ^ 0x574f524c44) | 1)
        self.controlled = self.rng.next() & 1
        self.polarity = 1. if self.rng.next() & 1 else -1.
        self.pos = [.5*self.rng.signed(), .5*self.rng.signed()]
        self.velocity, self.load = zeros(2), 0.
        self.target, self.gain, self.tick = .65, 1., 0
        self.kind, self.order, self.offset = kind, 0, zeros(2)
        self.jitter, self.cue_noise = 0., zeros(2)
        if kind:
            self.target, self.jitter = 0., .02
            self.landmarks()

    def landmarks(self):
        self.order = 1 if self.rng.next() & 1 else -1
        self.cue_noise = [self.rng.signed(), self.rng.signed()]

    def observe(self):
        o = self.pos[:] + [self.load]
        if self.kind:
            phase = self.tick % 6
            for k in range(2):
                v = 0.
                if phase in (1, 2):
                    first = 0 if self.order > 0 else 1
                    cue = first if phase == 1 else 1-first
                    v = (.8 if k == cue else 0.)+self.jitter*self.cue_noise[k]
                o[k] = self.offset[k]+self.gain*v
        return o

    def step(self, action):
        action = clip(action, -1., 1.)
        if self.kind:
            phase = self.tick % 6
            if phase == 3:
                self.load = .05 if action*self.order*self.polarity > .5 else .95
            elif phase == 4:
                self.load *= .5
            elif phase == 5:
                self.load = 0.
                self.landmarks()
        else:
            c, other = self.controlled, 1-self.controlled
            self.velocity[c] = .65*self.velocity[c]+.35*self.polarity*(1-.5*self.load)*action
            self.velocity[other] = .8*self.velocity[other]+.2*self.rng.signed()
            for k in (c, other):
                self.pos[k] = clip(.94*self.pos[k]+.14*self.velocity[k], -1., 1.)
            self.load = .9*self.load+.1*self.velocity[c]*self.velocity[c]
        self.tick += 1


class Amos:
    def __init__(self, seed=1, kind=0, glyphs=4, mode=0):
        self.seed, self.birth = seed, mix64(seed ^ 0x414d4f532d424952)
        self.world, self.subject = World(seed, kind), Subject(seed, mode, glyphs if kind else 0)
        self.memory = []

    def step(self, action=None, learn=True, exploration=.25):
        w, s = self.world, self.subject
        if s.glyph.enabled:
            s.glyph.learning = int(learn)
        o = w.observe()
        s.observe(o)
        action = s.action(w.target, exploration) if action is None else clip(action, -1., 1.)
        p, influence, f = s.predict(action), s.influence(), s.features(action)
        _, r = s.glyph.predict(action)
        sequence = s.glyph.sequence[:]
        w.step(action)
        nxt = w.observe()
        t = dict(tick=w.tick, observation=o, next=nxt, action=action, predicted=p,
                 influence=influence, features=f, sequence=sequence, recognition=r)
        if learn:
            delta = [nxt[k]-o[k] for k in range(3)]
            s.regress(f, delta)
            s.body.learn(o, nxt)
            if s.glyph.enabled:
                s.glyph.learn(sequence, action, delta)
        s.previous_action = action
        self.memory.append(t)
        self.memory = self.memory[-128:]
        return t

    def scar(self, future):
        a, b = self.subject, future.subject
        if (self.birth != future.birth or self.seed != future.seed or a.mode != b.mode or
            a.win != b.win or a.recurrent != b.recurrent or self.world.tick >= future.world.tick or
            a.glyph.enabled != b.glyph.enabled or a.glyph.prototypes != b.glyph.prototypes[:len(a.glyph.prototypes)]):
            raise ValueError('Incompatible temporal origin or neural/glyph basis')
        rows = [t for t in future.memory if self.world.tick < t['tick'] <= future.world.tick]
        if not rows:
            raise ValueError('No retained future experience')
        if a.glyph.enabled:
            a.glyph.prototypes = copy.deepcopy(b.glyph.prototypes)
        for t in rows:
            delta = [t['next'][k]-t['observation'][k] for k in range(3)]
            a.regress(t['features'], delta)
            if a.glyph.enabled:
                a.glyph.learn(t['sequence'], t['action'], delta)

    def dumps(self):
        def encode(x):
            if isinstance(x, Random):
                return {'random64': f'{x.state:016x}'}
            if hasattr(x, '__dict__'):
                return {k: (f'{v:016x}' if k in ('seed', 'birth') else v) for k, v in vars(x).items()}
            raise TypeError(type(x).__name__)
        return json.dumps({'format': 'AMOS-JSON-1', 'amos': self}, default=encode, allow_nan=False)

    @classmethod
    def loads(cls, text):
        data = json.loads(text)
        if data.get('format') != 'AMOS-JSON-1':
            raise ValueError('Unsupported snapshot format')
        d = data['amos']
        def keys(value, expected):
            if not isinstance(value, dict) or set(value) != set(expected):
                raise ValueError('Unexpected snapshot fields')
        keys(data, ('format', 'amos'))
        keys(d, ('seed', 'birth', 'world', 'subject', 'memory'))
        if not all(isinstance(d[k], str) and len(d[k]) == 16 and all(c in '0123456789abcdef' for c in d[k]) for k in ('seed', 'birth')):
            raise ValueError('Invalid hexadecimal origin')
        result = cls(int(d['seed'], 16))
        keys(d['world'], vars(result.world))
        keys(d['subject'], vars(result.subject))
        keys(d['subject']['glyph'], vars(result.subject.glyph))
        keys(d['subject']['body'], vars(result.subject.body))
        for rng in (d['world']['rng'], d['subject']['rng']):
            keys(rng, ('random64',))
            if not isinstance(rng['random64'], str) or len(rng['random64']) != 16 or any(c not in '0123456789abcdef' for c in rng['random64']):
                raise ValueError('Invalid random state')
        result.seed, result.birth = int(d['seed'], 16), int(d['birth'], 16)
        if result.birth != mix64(result.seed ^ 0x414d4f532d424952):
            raise ValueError('Invalid birth origin')
        result.world.__dict__.update(d['world'])
        result.world.rng = Random(int(d['world']['rng']['random64'], 16))
        result.subject.__dict__.update(d['subject'])
        result.subject.rng = Random(int(d['subject']['rng']['random64'], 16))
        result.subject.glyph = Glyphs()
        result.subject.glyph.__dict__.update(d['subject']['glyph'])
        result.subject.body = Embodiment()
        result.subject.body.__dict__.update(d['subject']['body'])
        result.memory = d['memory']
        # Structural validation uses freshly constructed shapes; never executes code.
        validate(result)
        return result


def validate(a):
    s, w, g = a.subject, a.world, a.subject.glyph
    def shape(x, *dims):
        if not dims:
            return isinstance(x, (int, float)) and not isinstance(x, bool) and math.isfinite(x) and abs(x) <= 1e30
        return isinstance(x, list) and len(x) == dims[0] and all(shape(v, *dims[1:]) for v in x)
    if not (0 <= a.seed <= MASK and 0 < w.rng.state <= MASK and 0 < s.rng.state <= MASK and
            s.mode in (0, 1, 2) and w.kind in (0, 1) and w.controlled in (0, 1) and
            w.polarity in (-1, 1) and 0 <= w.load <= 1 and w.gain > 0 and
            g.enabled in range(5) and g.learning in (0, 1) and g.anchored in (0, 1) and
            shape(s.h, H) and shape(s.win, H, 5) and shape(s.recurrent, H, H) and
            shape(s.weights, 3, F) and shape(s.covariance, F, F) and
            shape(s.observation, 3) and shape(g.sequence, K) and shape(g.familiarity, L) and
            shape(g.anchor, 2) and len(g.prototypes) <= G and all(shape(p, H) for p in g.prototypes) and
            len(g.evidence) <= E and len(g.duration) == L and all(isinstance(x, int) and 0 <= x <= MASK for x in g.duration) and
            shape(s.body.weights, 2, 3) and shape(s.body.covariance, 2, 3, 3) and shape(s.body.error, 2) and
            len(a.memory) <= 128):
        raise ValueError('Invalid snapshot structure')
    def counter(x):
        return type(x) is int and 0 <= x <= 2**53-1
    if not (counter(w.tick) and counter(s.updates) and counter(g.clock) and counter(s.body.samples) and
            all(counter(x) for x in g.duration) and all(x >= 0 for x in s.body.error) and
            shape(w.pos, 2) and shape(w.velocity, 2) and shape(w.offset, 2) and shape(w.cue_noise, 2) and
            all(shape(x) for x in (w.load,w.target,w.polarity,w.gain,w.jitter,s.previous_action)) and
            w.jitter >= 0 and abs(s.previous_action) <= 1 and
            (not w.kind or w.order in (-1,1)) and
            all(0 <= x <= 1 for x in g.sequence+g.familiarity)):
        raise ValueError('Invalid snapshot values')
    previous = 0
    for t in a.memory:
        if not (set(t) == {'tick','observation','next','action','predicted','influence','features','sequence','recognition'} and counter(t['tick']) and shape(t['predicted'],3) and shape(t['influence'],2) and
                set(t['recognition']) == {'similarity','support','uncertainty','ignorance','noise'} and all(shape(x) and x >= 0 for x in t['recognition'].values()) and previous < t['tick'] <= w.tick and abs(t['action']) <= 1 and
                shape(t['observation'], 3) and shape(t['next'], 3) and shape(t['features'], F) and shape(t['sequence'], K)):
            raise ValueError('Invalid retained transition')
        previous = t['tick']
    for e in g.evidence:
        if not (set(e) == {'key','mean','variance','mass','action','age'} and counter(e['age']) and shape(e['mass']) and shape(e['action']) and all(0 <= x <= 1 for x in e['key']) and shape(e['key'], K) and shape(e['mean'], 3) and shape(e['variance'], 3) and
                all(x >= 0 for x in e['variance']) and 1 <= e['mass'] <= 32 and abs(e['action']) <= 1 and 0 < e['age'] <= g.clock):
            raise ValueError('Invalid association')


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('command', choices=('demo', 'resume', 'scar'))
    p.add_argument('files', nargs='*')
    p.add_argument('--seed', type=int, default=1)
    p.add_argument('--steps', type=int, default=400)
    p.add_argument('--world', choices=('inertial', 'sequence'), default='inertial')
    p.add_argument('--glyphs', choices=('sequence', 'bag', 'neural', 'events'), default='events')
    p.add_argument('--mode', choices=('normal', 'memoryless', 'linear'), default='normal')
    p.add_argument('--state')
    p.add_argument('--explore', type=float, default=.25)
    p.add_argument('--frozen', action='store_true')
    p.add_argument('--reverse-body', action='store_true')
    args = p.parse_args()
    if not 0 <= args.seed <= MASK or args.steps < 0 or not 0 <= args.explore <= 1:
        p.error('Invalid seed, steps or exploration')
    if args.command == 'scar':
        if len(args.files) != 3:
            p.error('scar PAST FUTURE OUTPUT')
        a = Amos.loads(Path(args.files[0]).read_text())
        a.scar(Amos.loads(Path(args.files[1]).read_text()))
        Path(args.files[2]).write_text(a.dumps()+'\n')
        return
    if args.command == 'resume':
        if len(args.files) != 1:
            p.error('resume FILE')
        a = Amos.loads(Path(args.files[0]).read_text())
    else:
        a = Amos(args.seed, int(args.world == 'sequence'), ('', 'sequence', 'bag', 'neural', 'events').index(args.glyphs), ('normal', 'memoryless', 'linear').index(args.mode))
    if args.reverse_body:
        a.world.polarity *= -1
    for _ in range(args.steps):
        print(json.dumps(a.step(learn=not args.frozen, exploration=args.explore), allow_nan=False))
    output = args.state or (args.files[0] if args.command == 'resume' else None)
    if output:
        target = Path(output)
        tmp = target.with_name(target.name+'.tmp')
        tmp.write_text(a.dumps()+'\n')
        tmp.replace(target)


if __name__ == '__main__':
    main()

#!/usr/bin/env python3
"""Cross-language evidence: observations, learning, decisions, restart and scars."""
import copy
import hashlib
import importlib.util
import json
import math
from pathlib import Path
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('amos_ref', ROOT/'ports/amos.py')
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)


def rows(seed, mode, steps):
    a = m.Amos(seed, int(bool(mode)), mode)
    out = []
    for i in range(steps):
        t = a.step((i*7+i//5)%3-1, True, 0.)
        if i%13 and i+1 != steps:
            continue
        s = a.subject
        saved = s.rng.state
        decision = s.action(a.world.target, .1)
        s.rng.state = saved
        out.append(dict(tick=t['tick'], action=t['action'], predicted=t['predicted'], next=t['next'],
            h=s.h[:], weights=s.weights[2][:], body_error=s.body.error[:], decision=decision,
            rng=f'{a.world.rng.state:016x}', support=t['recognition']['support'] if mode else 0))
    return out, a


def compare(a, b, path='', maximum=0.):
    if isinstance(a, dict):
        assert a.keys() == b.keys(), (path, a.keys(), b.keys())
        for k in a:
            maximum = max(maximum, compare(a[k], b[k], path+'/'+k))
    elif isinstance(a, list):
        assert len(a) == len(b), path
        for i, (x, y) in enumerate(zip(a, b)):
            maximum = max(maximum, compare(x, y, path+f'/{i}'))
    elif isinstance(a, (int, float)):
        maximum = abs(a-b)
        if path.endswith(('/decision', '/tick', '/action')):
            assert a == b, (path, a, b)
        else:
            assert math.isclose(a, b, rel_tol=1e-8, abs_tol=1e-8), (path, a, b)
    else:
        assert a == b, (path, a, b)
    return maximum


def main():
    cases, peak = [], 0.
    with tempfile.TemporaryDirectory(prefix='amos-parity-') as tmp:
        tmp = Path(tmp)
        binary = tmp/'parity'
        subprocess.run(['cc','-O2','-std=c99','-Wall','-Wextra','-Werror','-Wno-unused-function',str(ROOT/'tests/parity.c'),'-lm','-o',str(binary)],check=True)
        for seed in (1, 5007, 18446744073709551615):
            for mode in (0, 1, 2, 3, 4):
                steps = 1920 if seed == 5007 and mode == 4 else 240
                c = [json.loads(x) for x in subprocess.check_output([str(binary), str(seed), str(mode), str(steps)],text=True).splitlines()]
                js = [json.loads(x) for x in subprocess.check_output(['node', str(ROOT/'tests/parity.js'), str(seed), str(mode), str(steps)],text=True).splitlines()]
                py, a = rows(seed, mode, steps)
                peak = max(peak, compare(c, py), compare(c, js))
                cases.append(dict(seed=str(seed), mode=mode, steps=steps, records=len(c)))
                resumed = m.Amos.loads(a.dumps())
                for _ in range(20):
                    assert a.step() == resumed.step(), 'Python restart divergence'
        # Transfer one acquired past and one future to JS; replay scar in each runtime.
        past = a
        future = copy.deepcopy(past)
        for _ in range(150):
            future.step()
        scar = copy.deepcopy(past)
        scar.scar(future)
        for name, value in [('past', past), ('future', future)]:
            (tmp/(name+'.json')).write_text(value.dumps())
        script = '''const fs=require('fs'),{Amos}=require(process.argv[1]);
const past=Amos.loads(fs.readFileSync(process.argv[2],'utf8'));
const future=Amos.loads(fs.readFileSync(process.argv[3],'utf8'));
past.scar(future);console.log(past.dumps());'''
        result = subprocess.check_output(['node','-e',script,str(ROOT/'web/amos.js'),str(tmp/'past.json'),str(tmp/'future.json')],text=True)
        imported = m.Amos.loads(result)
        peak = max(peak, compare(json.loads(scar.dumps()), json.loads(imported.dumps())))
        for _ in range(30):
            peak = max(peak, compare(scar.step(), imported.step()))
        # Each implementation independently reloads and continues its own output.
        script = '''const fs=require('fs'),{Amos}=require(process.argv[1]);
const a=Amos.loads(fs.readFileSync(process.argv[2],'utf8')),b=a.clone();
for(let i=0;i<149;i++) if(JSON.stringify(a.step())!==JSON.stringify(b.step())) throw Error('JS restart');
console.log(a.dumps());'''
        result = subprocess.check_output(['node','-e',script,str(ROOT/'web/amos.js'),str(tmp/'past.json')],text=True)
        m.Amos.loads(result)
        # An intentionally changed prediction proves numeric comparison is live.
        broken = copy.deepcopy(c)
        broken[0]['predicted'][0] += .1
        try:
            compare(c, broken)
        except AssertionError:
            pass
        else:
            raise AssertionError('Parity mutation not detected')
    report = dict(status='pass', cases=cases, maximum_absolute_difference=peak,
                  tolerance=dict(absolute=1e-8, relative=1e-8),
                  persistence='Exact per-runtime continuation; Python/JS checkpoint and scar interchange',
                  decision_comparison='Exact on sampled forced-trajectory states',
                  source_sha256={f: hashlib.sha256((ROOT/f).read_bytes()).hexdigest() for f in ('amos.c','ports/amos.py','web/amos.js')})
    (ROOT/'reports/ports.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps(report,indent=2))


if __name__ == '__main__':
    main()

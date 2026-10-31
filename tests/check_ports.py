#!/usr/bin/env python3
"""Three 24-neuron reference bodies: decisions, forecasts and restart continuity."""
import argparse
import importlib.util
import json
import math
from pathlib import Path
import subprocess
import sys
import tempfile

ROOT = Path(__file__).resolve().parents[1]
sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location('amos_reference', ROOT/'ports/amos.py')
reference = importlib.util.module_from_spec(spec)
spec.loader.exec_module(reference)
p = argparse.ArgumentParser(description=__doc__)
p.add_argument('--binary', type=Path, required=True)
args = p.parse_args()
binary = args.binary.resolve()


def c_run(seed, kind, mode, steps, output, resume=None):
    command = [str(binary), 'resume', str(resume)] if resume else [str(binary), 'demo', '--seed', str(seed), '--mode', ('normal', 'memoryless', 'linear')[mode]]
    if not resume and kind:
        command += ['--world', 'sequence', '--glyphs', 'events']
    command += ['--steps', str(steps), '--explore', '0.25', '--state', str(output)]
    return [json.loads(line) for line in subprocess.check_output(command, text=True).splitlines()]


def js_run(seed, kind, mode, steps, checkpoint=None):
    command = ['node', str(ROOT/'tests/port_probe.cjs'), str(seed), str(kind), str(mode), str(steps)]
    if checkpoint:
        command.append(str(checkpoint))
    lines = [json.loads(line) for line in subprocess.check_output(command, text=True).splitlines()]
    return lines[:-1], lines[-1]['checkpoint']


def equivalent(left, right, where):
    if isinstance(left, list):
        assert len(left) == len(right), where
        for i, (a, b) in enumerate(zip(left, right)):
            equivalent(a, b, f'{where}[{i}]')
    elif isinstance(left, dict):
        assert left.keys() == right.keys(), where
        for key in left:
            equivalent(left[key], right[key], f'{where}.{key}')
    elif isinstance(left, (int, float)) and not isinstance(left, bool):
        assert math.isclose(left, right, rel_tol=1e-8, abs_tol=1e-8), (where, left, right)
    else:
        assert left == right, (where, left, right)


with tempfile.TemporaryDirectory(prefix='amos-ports-') as temporary:
    work = Path(temporary)
    for seed, kind, mode in [(17, 1, 0), (7, 0, 0), (0, 1, 1), (23, 0, 2)]:
        steps, split = 400, 250
        body = reference.Amos(seed, kind, 4, mode)
        py = [body.step(exploration=.25) for _ in range(steps)]
        js, js_checkpoint = js_run(seed, kind, mode, steps)
        c = c_run(seed, kind, mode, steps, work/'continuous.state')
        for i, (a, b, d) in enumerate(zip(py, js, c)):
            assert a['action'] == b['action'] == d['action'], ('decision', seed, i)
            equivalent(a, b, f'Python/JS seed={seed} tick={i+1}')
            for key, c_key in [('observation', 'observation'), ('next', 'actual'), ('predicted', 'predicted'), ('influence', 'influence')]:
                equivalent(a[key], d[c_key], f'Python/C {key} seed={seed} tick={i+1}')
        c_run(seed, kind, mode, split, work/'past.state')
        c_run(seed, kind, mode, steps-split, work/'resumed.state', resume=work/'past.state')
        assert (work/'continuous.state').read_bytes() == (work/'resumed.state').read_bytes(), 'C restart diverged'
        (work/'python.json').write_text(body.dumps())
        (work/'js.json').write_text(js_checkpoint)
        python_from_js = reference.Amos.loads(js_checkpoint)
        js_from_python, _ = js_run(seed, kind, mode, 12, work/'python.json')
        restored = reference.Amos.loads(body.dumps())
        for i in range(12):
            a = body.step(exploration=.25)
            equivalent(a, restored.step(exploration=.25), 'Python restart')
            equivalent(a, python_from_js.step(exploration=.25), 'JS checkpoint → Python')
            equivalent(a, js_from_python[i], 'Python checkpoint → JS')
        print(f'PASS seed={seed} world={kind} mode={mode}: 400 decisions, C restart, Python/JS checkpoint exchange')
print('PASS 1600 matching reference decisions; numerical tolerance abs/rel 1e-8')

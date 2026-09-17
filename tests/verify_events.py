#!/usr/bin/env python3
"""AMOS-2 held-out court with explicit controls and persistence contracts."""
import hashlib
import json
from pathlib import Path
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[1]


def compile_c(source, target, flags=()):
    subprocess.run(['cc','-std=c99','-O2','-Wall','-Wextra','-Wpedantic','-Werror','-Wno-unused-function',*flags,str(source),'-lm','-o',str(target)],check=True)


def main():
    with tempfile.TemporaryDirectory(prefix='amos-events-') as tmp:
        tmp = Path(tmp)
        compile_c(ROOT/'tests/test_events.c', tmp/'contracts')
        contracts = subprocess.check_output([str(tmp/'contracts')],cwd=tmp,text=True).splitlines()
        compile_c(ROOT/'tests/evaluate_events.c',tmp/'evaluate')
        raw = subprocess.check_output([str(tmp/'evaluate')],text=True)
        rows = [json.loads(x) for x in raw.splitlines()]
        assert len(rows) == 32 and [r['seed'] for r in rows] == list(range(5001,5033))
        totals = {name: [sum(r[name][i] for r in rows) for i in range(5)] for name in ('events','frames')}
        for name in ('events_variable','frames_variable','body','body_interrupted','ambiguous'):
            totals[name] = sum(r[name] for r in rows)
        gates = dict(events_all_delays=min(totals['events']) >= .95*3072,
                     events_variable=totals['events_variable'] >= .95*3072,
                     body_attribution=totals['body'] >= 30,
                     body_interruption=totals['body_interrupted'] >= 30,
                     observational_ambiguity=totals['ambiguous']==32)
        # Mutations retain the same inputs and evaluator; every red result is checked.
        source = (ROOT/'amos.c').read_text()
        red = {}
        mutants = {
            'neural_field_leak': ('s->glyph.enabled != GLYPH_NEURAL_ONLY && s->glyph.learning', 's->glyph.learning', 'recognition_ignorance(r)', 'r.uncertainty'),
            'noise_seeking': ('cost -= exploration * recognition_ignorance(r);','cost -= exploration * r.uncertainty;'),
        }
        for name, replacements in mutants.items():
            modified = source
            for a, b in zip(replacements[::2], replacements[1::2]):
                assert a in modified
                modified = modified.replace(a,b)
            (tmp/'amos.c').write_text(modified)
            (tmp/'contracts.c').write_text((ROOT/'tests/test_events.c').read_text().replace('../amos.c','amos.c'))
            compile_c(tmp/'contracts.c',tmp/'red')
            result = subprocess.run([str(tmp/'red')],cwd=tmp,capture_output=True,text=True)
            red[name] = result.returncode != 0 and 'Assertion' in result.stderr
        # Control: removing event coalescing must break cadence robustness.
        (tmp/'amos.c').write_text(source.replace('repeat = g->enabled == GLYPH_EVENTS &&', 'repeat = 0 &&'))
        (tmp/'evaluate_glyphs.c').write_bytes((ROOT/'evaluate_glyphs.c').read_bytes())
        (tmp/'evaluate_events.c').write_text((ROOT/'tests/evaluate_events.c').read_text().replace('../evaluate_glyphs.c','evaluate_glyphs.c'))
        compile_c(tmp/'evaluate_events.c',tmp/'red-events')
        mutated = [json.loads(x) for x in subprocess.check_output([str(tmp/'red-events'),'--dev'],text=True).splitlines()]
        red['removed_event_boundary'] = sum(r['events'][-1] for r in mutated) < .95*8*96
        # No observation/consequence relationship: competing bodily models become equal.
        (tmp/'amos.c').write_text(source.replace('next->x[c] - o->x[c]', 'next->x[0] - o->x[0]'))
        compile_c(tmp/'evaluate_events.c',tmp/'red-body')
        mutated = [json.loads(x) for x in subprocess.check_output([str(tmp/'red-body'),'--dev'],text=True).splitlines()]
        red['lost_body_distinction'] = sum(r['body'] for r in mutated) == 0
        compile_c(ROOT/'tests/test_events.c',tmp/'sanitized',['-O1','-g','-fsanitize=address,undefined','-fno-omit-frame-pointer'])
        import os
        subprocess.run([str(tmp/'sanitized')],cwd=tmp,check=True,capture_output=True,
                       env=dict(os.environ,ASAN_OPTIONS='detect_leaks=0:halt_on_error=1',UBSAN_OPTIONS='halt_on_error=1'))
    report = dict(status='pass' if all(gates.values()) and all(red.values()) else 'fail',
                  seeds='5001–5032', decisions_per_delay=3072, extra_samples=[0,1,2,4,8], totals=totals,
                  gates=gates, red_controls=red, contracts=contracts,
                  scope='Cadence changes repeat sensor samples; no claim of arbitrary event-rate or timing generalization. Body identification is a separate diagnostic with a specified load law.',
                  source_sha256=hashlib.sha256((ROOT/'amos.c').read_bytes()).hexdigest(),
                  protocol_sha256=hashlib.sha256((ROOT/'docs/AMOS2_PROTOCOL.md').read_bytes()).hexdigest())
    (ROOT/'reports/events-seeds.jsonl').write_text(raw)
    (ROOT/'reports/events.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps(report,indent=2))
    assert report['status']=='pass'


if __name__ == '__main__':
    main()

#!/usr/bin/env python3
"""Build the single-file AMOS-2 world from pinned, inspectable source organs."""
from pathlib import Path
import re
import sys

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
MODULES = ['ledger.js', 'journal.js', 'hypothesis.js', 'tools.js', 'sources/usgs.js', 'sources/geolocation.js']

def lalo_bundle():
    out = ['const LALO = (() => {', 'const organs = {};']
    for name in MODULES:
        source = (HERE / 'vendor/lalo' / name).read_text()
        exports = re.findall(r'export\s+(?:class|function|const)\s+(\w+)', source)
        def imported(m):
            names, relative = m.groups()
            target = str((Path(name).parent / relative).as_posix())
            parts = []
            for part in target.split('/'):
                if part == '..': parts.pop()
                elif part != '.': parts.append(part)
            return f'const {{{names}}} = organs["{"/".join(parts)}"];'
        source = re.sub(r"import\s*\{([^}]+)\}\s*from\s*'([^']+)';", imported, source)
        source = re.sub(r'\bexport\s+', '', source)
        out.append(f'// LALO source organ: {name}\norgans["{name}"] = (() => {{\n{source}\nreturn {{{",".join(exports)}}};\n}})();')
    out.append('return Object.assign({}, ...Object.values(organs));\n})();')
    return '\n'.join(out)

html = (HERE / 'shell.html').read_text()
html = html.replace('/* AMOS2_STYLE */', (HERE / 'style.css').read_text())
html = html.replace('/* AMOS2_LICENSE */', (HERE / 'vendor/lalo/LICENSE').read_text().replace('&', '&amp;').replace('<', '&lt;'))
sources = [ROOT/'web/amos.js', HERE/'vendor/life-semantic.js', HERE/'languages.js', HERE/'voice.js', HERE/'relations.js', HERE/'perception.js', HERE/'cognition.js', HERE/'sonar.js', HERE/'transitions.js', HERE/'engine.js', HERE/'ui.js']
scripts = [sources[0].read_text(), lalo_bundle()] + [p.read_text() for p in sources[1:]]
html = html.replace('/* AMOS2_SCRIPTS */', '\n\n'.join(scripts).replace('</script', '<\\/script'))
target = ROOT/'Amos-2.html'
if '--check' in sys.argv:
    if not target.exists() or target.read_text()!=html:
        raise SystemExit('Amos-2.html is stale; run make world')
    print(f'{target}: reproducible ({target.stat().st_size:,} bytes)')
else:
    target.write_text(html)
    print(f'{target}: {target.stat().st_size:,} bytes')

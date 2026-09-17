#!/usr/bin/env python3
"""Bundle the local laboratory into one offline HTML; standard library only."""
from pathlib import Path
import argparse

root = Path(__file__).resolve().parents[1]
p = argparse.ArgumentParser(description=__doc__)
p.add_argument('output', nargs='?', type=Path, default=root/'dist/AMOS-Laboratory.html')
args = p.parse_args()
html = (root/'web/index.html').read_text()
html = html.replace('<link rel="stylesheet" href="style.css">', '<style>\n'+(root/'web/style.css').read_text()+'\n</style>')
for name in ('amos.js','lab.js'):
    html = html.replace(f'<script src="{name}"></script>', '<script>\n'+(root/'web'/name).read_text().replace('</script', '<\\/script')+'\n</script>')
args.output.parent.mkdir(parents=True, exist_ok=True)
args.output.write_text(html)
print(args.output)

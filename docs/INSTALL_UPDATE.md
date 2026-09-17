# Applying this update

Prepared against `ariannamethod/amos` main at
`04a5cdce436128ef9761cb98bb54ee866eed8b43`.

The archive contains the full source tree, including the author's README with
technical additions, restored documents and historical reports, current tests,
Python reference and offline browser laboratory. The C runtime remains `amos.c`.
The separate `AMOS-2.patch` contains only changes to the above repository revision.

For an existing local clone, put the patch outside the repository, then:

```
git switch -c amos-laboratory
git apply --check /path/to/AMOS-2.patch
git apply /path/to/AMOS-2.patch
make check
make lab
```

If the check reports conflicts, reconcile with newer local edits before applying.
Alternatively, unpack the full archive into a new directory and run `make check`.
Python 3 and Node are used for cross-language verification; only a C compiler
and libm are needed to compile and run the C body.

Open `web/index.html` directly, or open the separately supplied
`AMOS-Laboratory.html`. Neither needs a server. `make lab` regenerates the latter
under `dist/` from the authoritative web sources.

The archive and patch were prepared while the GitHub connection had read-only
access. Write access was subsequently restored by signing in as `ariannamethod`.
The repository history records the published update.

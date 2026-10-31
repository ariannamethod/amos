CC ?= cc
CFLAGS ?= -O2 -std=c99 -Wall -Wextra -Wpedantic
PYTHON ?= python3
NODE ?= node

.PHONY: check check-ports check-world lab world clean

amos: amos.c
	$(CC) $(CFLAGS) $< -lm -o $@

check: check-ports check-world

check-ports: amos
	$(PYTHON) tests/check_ports.py --binary ./amos

check-world:
	$(PYTHON) worlds/lalo/build.py --check
	$(NODE) --test worlds/lalo/check.mjs

lab:
	$(PYTHON) tools/build_lab.py

world:
	$(PYTHON) worlds/lalo/build.py

clean:
	rm -f amos

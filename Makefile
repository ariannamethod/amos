CC ?= cc
CFLAGS ?= -O2 -std=c99 -Wall -Wextra -Wpedantic

all: amos

amos: amos.c
	$(CC) $(CFLAGS) amos.c -lm -o amos

evaluate: evaluate.c amos.c
	$(CC) $(CFLAGS) -Wno-unused-function evaluate.c -lm -o evaluate

check: amos
	mkdir -p reports
	python3 tests/test_contracts.py --json > reports/contracts.json.tmp
	mv reports/contracts.json.tmp reports/contracts.json
	python3 tests/verify.py
	python3 tests/verify_glyphs.py
	python3 tests/verify_events.py
	python3 tests/verify_ports.py

lab:
	python3 tools/build_lab.py

check-browser:
	node tests/browser.js

measure: amos
	python3 measure.py

clean:
	rm -f amos evaluate evaluate_glyphs

.PHONY: all check check-browser lab measure clean

#!/usr/bin/env python3
"""Fixed AMOS-1 court, all per-birth results, causal source mutations."""
import hashlib
import json
import os
from pathlib import Path
import shlex
import subprocess
import tempfile
from statistics import mean

ROOT = Path(__file__).resolve().parent
CC = shlex.split(os.environ.get("CC", "cc"))
FLAGS = ["-O2", "-std=c99", "-Wall", "-Wextra", "-Wpedantic", "-Werror", "-Wno-unused-function"]


def compile_c(folder, name, extra=()):
    subprocess.run(CC + FLAGS + list(extra) + [str(folder / (name + ".c")), "-lm",
                   "-o", str(folder / name)], check=True)
    return str(folder / name)


def summarize(rows):
    names = [k for k, v in rows[0].items() if isinstance(v, dict)]
    result = {k: {m: mean(r[k][m] for r in rows) for m in rows[0][k]} for k in names}
    for k in names:
        if "correct" in result[k]:
            result[k]["accuracy"] = sum(r[k]["correct"] for r in rows) / sum(r[k]["decisions"] for r in rows)
            result[k]["correct_total"] = sum(r[k]["correct"] for r in rows)
            result[k]["decisions_total"] = sum(r[k]["decisions"] for r in rows)
    result["births"] = len(rows)
    result["polarity_counts"] = [sum(r["polarity"] == p for r in rows) for p in (-1, 1)]
    result["glyph_range"] = [min(r["glyphs"] for r in rows), max(r["glyphs"] for r in rows)]
    result["association_range"] = [min(r["associations"] for r in rows), max(r["associations"] for r in rows)]
    return result


def gates(r):
    p, t, b, n = (r[k] for k in ("plain", "transfer", "bag", "neural_only"))
    wrong, early, repair = (r[k] for k in ("reversed_frozen", "reversed_early", "reversed_repaired"))
    return {
        "appearance_transfer": min(r["polarity_counts"]) > 0 and min(p["accuracy"], t["accuracy"]) >= .95
            and t["load_mse"] < .02 and r["perturbed"]["accuracy"] >= .90,
        "sequence_consequence_prediction": t["load_mse"] < .20 * min(b["load_mse"], n["load_mse"]),
        "order_changes_decisions": r["shuffled"]["accuracy"] <= .25
            and r["shuffled"]["load_mse"] > 5*t["load_mse"],
        "mistaken_recognition_and_repair": wrong["accuracy"] <= .25 and wrong["similarity"] >= .90
            and repair["accuracy"] >= .90 and repair["load_mse"] < .15*wrong["load_mse"]
            and early["uncertainty"] > 1.30*wrong["uncertainty"] and repair["uncertainty"] < early["uncertainty"],
        "familiar_but_uncertain": r["conflicting"]["similarity"] >= .90
            and r["conflicting"]["uncertainty"] > 1.50*p["uncertainty"],
        "unfamiliar_is_distinct": r["unfamiliar"]["similarity"] < .30
            and r["unfamiliar"]["uncertainty"] > 2*p["uncertainty"],
    }


def evaluate(folder, name, dev=False):
    binary = compile_c(folder, "evaluate_glyphs")
    out = subprocess.check_output([binary] + (["--dev"] if dev else []), text=True)
    rows = [json.loads(line) for line in out.splitlines()]
    if len(rows) != (8 if dev else 32):
        raise RuntimeError("Incomplete birth record")
    r = summarize(rows)
    r["gates"] = gates(r)
    r["core_sha256"] = hashlib.sha256((folder / "amos.c").read_bytes()).hexdigest()
    (ROOT / "reports" / (name + "-seeds.jsonl")).write_text(out)
    (ROOT / "reports" / (name + ".json")).write_text(json.dumps(r, indent=2) + "\n")
    return r


def contracts():
    result = {}
    with tempfile.TemporaryDirectory(prefix="amos-glyph-contracts-") as tmp:
        p = Path(tmp)
        for name in ("amos.c", "test_glyphs.c"):
            (p / name).write_bytes((ROOT / name).read_bytes())
        binary = compile_c(p, "test_glyphs")
        result["checks"] = subprocess.check_output([binary], cwd=p, text=True).splitlines()
        binary = compile_c(p, "test_glyphs", ["-DMUTATE_GLYPH_RESTORE"])
        mutant = subprocess.run([binary], cwd=p, capture_output=True, text=True)
        if mutant.returncode == 0 or "restore every glyph" not in mutant.stderr:
            raise RuntimeError("Restored-sequence loss was not detected")
        result["red_restore"] = mutant.stderr.strip()
        binary = compile_c(p, "test_glyphs", ["-O1", "-g", "-fsanitize=address,undefined", "-fno-omit-frame-pointer"])
        env = dict(os.environ, ASAN_OPTIONS="detect_leaks=0:halt_on_error=1", UBSAN_OPTIONS="halt_on_error=1")
        subprocess.run([binary], cwd=p, env=env, check=True, capture_output=True, text=True)
        result["sanitizers"] = "AddressSanitizer and UBSan pass; LeakSanitizer disabled in this execution environment."
        binary = compile_c(p, "amos")
        # All original fixtures are v1; compare actual continuation, not just decoding.
        out = subprocess.check_output([binary, "resume", str(ROOT/"examples/changed.state"),
            "--steps", "400", "--frozen", "--explore", "0", "--state", str(p/"upgraded.state")], text=True)
        if out != (ROOT/"examples/clean.jsonl").read_text():
            raise RuntimeError("Version-1 continuation changed")
        result["legacy"] = "Original AMOS0001 fixture reproduces all 400 JSON records exactly."
        # CLI uses the same decision-time metadata as the in-process interface.
        full = subprocess.check_output([binary,"demo","--world","sequence","--seed","29",
            "--steps","199","--state",str(p/"full.state")], text=True)
        head = subprocess.check_output([binary,"demo","--world","sequence","--seed","29",
            "--steps","71","--state",str(p/"split.state")], text=True)
        tail = subprocess.check_output([binary,"resume",str(p/"split.state"),"--steps","128"], text=True)
        if full != head+tail or (p/"full.state").read_bytes() != (p/"split.state").read_bytes():
            raise RuntimeError("Sequence CLI split continuation changed")
        for line in full.splitlines():
            row = json.loads(line)
            if len(row["glyphs"]) != 4 or len(row["glyph_mixture"]) != 8:
                raise RuntimeError("Missing observable glyph state")
        result["cli"] = "199-step exact JSONL and snapshot continuation; observable glyph mixtures."
    return result


def main():
    (ROOT / "reports").mkdir(exist_ok=True)
    contract_report = contracts()
    normal = evaluate(ROOT, "glyph-heldout")
    source = (ROOT / "amos.c").read_text()
    mutations = {
        "collapsed-neural-signature": ("signature[i] = tanh(v);", "signature[i] = 0.;", "sequence_consequence_prediction"),
        "unordered-retrieval": ("if (mode == GLYPH_BAG)", "if (mode != GLYPH_NEURAL_ONLY)", "sequence_consequence_prediction"),
        "disconnected-field": ("blend = r.similarity * r.support / (1. + r.support);", "blend = 0.; (void)r;", "sequence_consequence_prediction"),
        "ignored-outcome-dispersion": ("sqrt(variance + 1. / (1. + r.support))", "sqrt(0.*variance + 1. / (1. + r.support))", "familiar_but_uncertain"),
        "ignored-prototype-distance": ("g->familiarity[AMOS_L - 1] = exp(-best / .025);", "g->familiarity[AMOS_L - 1] = 1.;", "unfamiliar_is_distinct"),
    }
    red = {}
    for name, (needle, replacement, gate) in mutations.items():
        if source.count(needle) != 1:
            raise RuntimeError("Mutation site changed: " + name)
        with tempfile.TemporaryDirectory(prefix="amos-glyph-red-") as tmp:
            p = Path(tmp)
            (p/"amos.c").write_text(source.replace(needle, replacement))
            (p/"evaluate_glyphs.c").write_bytes((ROOT/"evaluate_glyphs.c").read_bytes())
            r = evaluate(p, "glyph-red-" + name, dev=True)
            red[name] = not r["gates"][gate]
    report = {"status": "pass" if all(normal["gates"].values()) and all(red.values()) else "fail",
              "numerical_gates": normal["gates"], "red_controls_detected": red,
              "contracts": contract_report, "source_sha256": normal["core_sha256"],
              "protocol_sha256": hashlib.sha256((ROOT/"GLYPH_PROTOCOL.md").read_bytes()).hexdigest()}
    (ROOT/"reports/glyph-verification.json").write_text(json.dumps(report, indent=2)+"\n")
    print(json.dumps(report, indent=2))
    if report["status"] != "pass":
        raise SystemExit(1)


if __name__ == "__main__":
    main()

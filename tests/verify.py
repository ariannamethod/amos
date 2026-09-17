#!/usr/bin/env python3
"""Run the fixed AMOS numerical protocol, retain every seed, exercise a red gate."""
import hashlib
import json
import os
from pathlib import Path
import shlex
import subprocess
import tempfile
import time

ROOT = Path(__file__).resolve().parent


def gates(r):
    n = r["seeds"]
    p = r["prediction"]
    a = r["aliased_observation"]
    b = r["body_reversal_mse"]
    s = r["scar"]
    return {
        "learned_controllability": r["identified"] / n >= 30 / 32
            and min(r["wiring_counts"]) > 0 and min(r["polarity_counts"]) > 0,
        "recurrent_body_prediction": p["recurrent"]["body_mse"]
            < .10 * min(p["memoryless"]["body_mse"], p["persistence"]["body_mse"]),
        "bodily_self_prediction": p["recurrent"]["load_mse"]
            < .50 * min(p["memoryless"]["load_mse"], p["persistence"]["load_mse"]),
        "history_changes_action": a["distinct_actions"][0] / n >= 28 / 32
            and a["braking_actions"][0] / (2 * n) >= 58 / 64
            and a["first_step_mse"][0] < .50 * a["first_step_mse"][1]
            and a["distinct_actions"][1:] == [0, 0],
        "acquired_belief_is_causal": r["belief_intervention_changed_actions"]
            / r["belief_intervention_total"] >= .80,
        "body_reversal_adaptation": b["adapted"] < .50 * b["frozen"],
        "retained_future_experience": s["accepted"] == n
            and s["useful_mse"] < .85 * min(s["clean_mse"], s["mislabeled_mse"]),
    }


def run_evaluation(folder, report_name, dev=False):
    cc = shlex.split(os.environ.get("CC", "cc"))
    binary = folder / "evaluate"
    subprocess.run(cc + ["-std=c99", "-O2", "-Wall", "-Wextra", "-Wpedantic",
                        "-Werror", "-Wno-unused-function", str(folder / "evaluate.c"),
                        "-lm", "-o", str(binary)], check=True)
    started = time.perf_counter()
    result = subprocess.run([str(binary)] + (["--dev"] if dev else []),
                            text=True, capture_output=True, check=True)
    elapsed = time.perf_counter() - started
    r = json.loads(result.stdout)
    rows = [json.loads(line) for line in result.stderr.splitlines()]
    if len(rows) != r["seeds"]:
        raise RuntimeError("Missing per-seed results")
    r["gates"] = gates(r)
    r["elapsed_seconds"] = elapsed
    r["core_sha256"] = hashlib.sha256((folder / "amos.c").read_bytes()).hexdigest()
    reports = ROOT / "reports"
    reports.mkdir(exist_ok=True)
    (reports / (report_name + ".json")).write_text(json.dumps(r, indent=2) + "\n")
    (reports / (report_name + "-seeds.jsonl")).write_text(result.stderr)
    return r


def main():
    source = (ROOT / "amos.c").read_text()
    normal = run_evaluation(ROOT, "heldout")
    failed = [name for name, passed in normal["gates"].items() if not passed]
    # Counterfeit recurrence: even normal births now get the independently
    # learned memoryless network. The original implementation is never edited.
    needle = "s->mode = mode;"
    if source.count(needle) != 1:
        raise RuntimeError("Cannot locate the intended mutation site")
    with tempfile.TemporaryDirectory(prefix="amos-red-") as tmp:
        folder = Path(tmp)
        (folder / "amos.c").write_text(source.replace(
            needle, "s->mode = mode == AMOS_NORMAL ? AMOS_MEMORYLESS : mode;"))
        (folder / "evaluate.c").write_bytes((ROOT / "evaluate.c").read_bytes())
        mutant = run_evaluation(folder, "red-memoryless", dev=True)
    red = {name: not mutant["gates"][name] for name in
           ("recurrent_body_prediction", "history_changes_action")}
    report = {"numerical_gates": normal["gates"], "red_controls_detected": red,
              "source_sha256": normal["core_sha256"],
              "protocol_sha256": hashlib.sha256((ROOT / "PROTOCOL.md").read_bytes()).hexdigest(),
              "status": "pass" if not failed and all(red.values()) else "fail"}
    (ROOT / "reports" / "verification.json").write_text(json.dumps(report, indent=2) + "\n")
    print(json.dumps(report, indent=2))
    if report["status"] != "pass":
        raise SystemExit(1)


if __name__ == "__main__":
    main()

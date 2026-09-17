#!/usr/bin/env python3
"""Independent AMOS snapshot/continuation contracts; Python standard library only.

The C harness uses the public in-process interface, not CLI text as its oracle.
Temporary wrappers deliberately break restoration and scar propagation to show
that the corresponding gates detect a real loss of behavior.
"""

import argparse
import hashlib
import json
import os
from pathlib import Path
import shlex
import subprocess
import sys
import tempfile


HARNESS = r'''
#ifdef MUTATE_RESTORE_RNG
#define snapshot_load original_snapshot_load
#endif
#if defined(MUTATE_SCAR_NOOP) || defined(MUTATE_SCAR_WORLD)
#define snapshot_scar original_snapshot_scar
#endif
#define AMOS_NO_MAIN
#include "CORE_SOURCE"

#ifdef MUTATE_RESTORE_RNG
#undef snapshot_load
static int snapshot_load(Snapshot *s, const char *path) {
    int ok = original_snapshot_load(s, path);
    if (ok) s->world.rng ^= UINT64_C(0x6a09e667f3bcc909);
    return ok;
}
#endif
#if defined(MUTATE_SCAR_NOOP) || defined(MUTATE_SCAR_WORLD)
#undef snapshot_scar
static int snapshot_scar(Snapshot *past, const Snapshot *future) {
    Snapshot original = *past;
    int ok = original_snapshot_scar(past, future);
#ifdef MUTATE_SCAR_NOOP
    if (ok) *past = original;
#else
    (void)original;
    if (ok) past->world = future->world;
#endif
    return ok;
}
#endif

static void require(int condition, const char *message) {
    if (!condition) {
        fprintf(stderr, "CONTRACT FAILURE: %s\n", message);
        exit(1);
    }
}

static void run_steps(Snapshot *s, int count) {
    int i;
    for (i = 0; i < count; ++i) {
        Transition tr;
        memset(&tr, 0, sizeof(tr));
        snapshot_step(s, NAN, 1, 0.37, &tr);
    }
}

static int files_identical(const char *left, const char *right) {
    FILE *a = fopen(left, "rb"), *b = fopen(right, "rb");
    int ca, cb, result = 1;
    require(a != NULL && b != NULL, "open saved snapshots for comparison");
    do {
        ca = fgetc(a); cb = fgetc(b);
        if (ca != cb) { result = 0; break; }
    } while (ca != EOF);
    require(!ferror(a) && !ferror(b), "read complete saved snapshots");
    fclose(a); fclose(b);
    return result;
}

static int states_identical(const Snapshot *a, const Snapshot *b) {
    require(snapshot_save(a, "comparison-a.state"), "save comparison A");
    require(snapshot_save(b, "comparison-b.state"), "save comparison B");
    return files_identical("comparison-a.state", "comparison-b.state");
}

static void test_replay(void) {
    Snapshot continuous, resumed, duplicate;
    int i;
    snapshot_init(&continuous, UINT64_C(17091), 0);
    snapshot_init(&duplicate, UINT64_C(17091), 0);
    require(states_identical(&continuous, &duplicate), "same-seed initial state");
    run_steps(&continuous, 173);
    run_steps(&duplicate, 173);
    require(states_identical(&continuous, &duplicate), "same-seed learned trajectory");
    require(snapshot_save(&continuous, "checkpoint.state"), "save checkpoint");
    memset(&resumed, 0xa5, sizeof(resumed));
    require(snapshot_load(&resumed, "checkpoint.state"), "load checkpoint");
    require(states_identical(&continuous, &resumed), "complete state restoration");
    for (i = 0; i < 149; ++i) {
        run_steps(&continuous, 1);
        run_steps(&resumed, 1);
        require(states_identical(&continuous, &resumed), "exact future trajectory after resume");
    }
    puts("PASS exact save/resume, RNG continuation, ring wrap and deterministic seed");
}

static void test_rejected_file(const char *path) {
    Snapshot target, before;
    snapshot_init(&target, UINT64_C(30911), 0);
    run_steps(&target, 19);
    before = target;
    require(!snapshot_load(&target, path), "invalid snapshot must be rejected");
    require(states_identical(&target, &before), "failed load preserves destination");
    puts("PASS invalid snapshot rejected without modifying destination");
}

static void test_scar(void) {
    Snapshot past, saved_past, future, other_birth, scarred;
    int predictor_changed;
    snapshot_init(&past, UINT64_C(98117), 0);
    run_steps(&past, 17);
    saved_past = past;
    future = past;
    run_steps(&future, 293);
    require(snapshot_save(&past, "past.state"), "save scar past");
    require(snapshot_save(&future, "future.state"), "save scar future");
    scarred = past;
    require(snapshot_scar(&scarred, &future), "same-origin future scar accepted");
    require(snapshot_save(&scarred, "scar.state"), "save scar result");
    predictor_changed = memcmp(scarred.subject.weights, past.subject.weights,
                               sizeof(past.subject.weights)) != 0;
    require(predictor_changed, "future experience changes acquired predictor");
    /* Normalize only the explicitly permitted predictor changes. Everything
       else, including past world, clock, random streams and biography, stays. */
    memcpy(scarred.subject.weights, past.subject.weights, sizeof(past.subject.weights));
    memcpy(scarred.subject.covariance, past.subject.covariance,
           sizeof(past.subject.covariance));
    scarred.subject.updates = past.subject.updates;
    require(states_identical(&scarred, &saved_past),
            "scar changes only predictor weights/covariance/update count");
    scarred = future;
    scarred.subject.win[0][0] += .125;
    require(!snapshot_scar(&past, &scarred), "scar rejects incompatible fixed neural basis");
    require(states_identical(&past, &saved_past), "incompatible scar preserves destination");
    snapshot_init(&other_birth, UINT64_C(98118), 0);
    run_steps(&other_birth, 310);
    require(snapshot_save(&other_birth, "other-birth.state"), "save unrelated birth");
    require(!snapshot_scar(&past, &other_birth), "scar rejects unrelated birth");
    require(states_identical(&past, &saved_past), "rejected scar preserves destination");
    puts("PASS scar causal boundary, immutable origin and unrelated-birth rejection");
}

static void test_body_reversal(const char *original_path, const char *changed_path) {
    Snapshot original, changed;
    require(snapshot_load(&original, original_path), "load body intervention origin");
    require(snapshot_load(&changed, changed_path), "load body intervention result");
    original.world.polarity = -original.world.polarity;
    require(states_identical(&original, &changed),
            "body reversal changes only world actuator polarity");
    puts("PASS body reversal leaves subject, time, origin and both RNGs unchanged");
}

int main(int argc, char **argv) {
    require(argc >= 2, "test mode is required");
    if (strcmp(argv[1], "replay") == 0) test_replay();
    else if (strcmp(argv[1], "scar") == 0) test_scar();
    else if (strcmp(argv[1], "reject") == 0) {
        require(argc == 3, "rejection test needs a file");
        test_rejected_file(argv[2]);
    } else if (strcmp(argv[1], "body-reversal") == 0) {
        require(argc == 4, "body reversal test needs original and changed files");
        test_body_reversal(argv[2], argv[3]);
    } else require(0, "unknown test mode");
    return 0;
}
'''


def command(args, cwd, *, expect=0, env=None):
    result = subprocess.run(args, cwd=cwd, text=True, capture_output=True, env=env)
    if (expect == 0 and result.returncode != 0) or (expect != 0 and result.returncode == 0):
        raise RuntimeError(
            f"Unexpected exit {result.returncode}: {shlex.join(map(str, args))}\n"
            f"{result.stdout}{result.stderr}"
        )
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=Path, default=Path(__file__).resolve().parents[1] / "amos.c")
    parser.add_argument("--json", action="store_true")
    parser.add_argument("--no-sanitize", action="store_true")
    args = parser.parse_args()
    source = args.source.resolve()
    source_hash = hashlib.sha256(source.read_bytes()).hexdigest()
    compiler = shlex.split(os.environ.get("CC", "cc"))
    strict = ["-std=c99", "-Wall", "-Wextra", "-Wpedantic", "-Werror"]
    report = {"source": str(source), "source_sha256": source_hash,
              "compiler": compiler, "checks": [], "red_controls": []}
    with tempfile.TemporaryDirectory(prefix="amos-contracts-") as directory:
        work = Path(directory)
        executable = work / "amos"
        command(compiler + strict + ["-O2", str(source), "-lm", "-o", str(executable)], work)
        report["checks"].append("standalone strict C99 build")
        harness = work / "contracts.c"
        harness.write_text(HARNESS.replace("CORE_SOURCE", str(source)), encoding="utf-8")

        def build(name, extra=()):
            binary = work / name
            command(compiler + strict + ["-Wno-unused-function", "-O1"] + list(extra)
                    + [str(harness), "-lm", "-o", str(binary)], work)
            return binary

        binary = build("contracts")
        for mode in ("replay", "scar"):
            command([str(binary), mode], work)
            report["checks"].append(mode)
        cli = [str(executable)]
        uninterrupted = command(cli + ["demo", "--seed", "171", "--steps", "149",
            "--explore", "0.37", "--state", "whole.state", "--trace", "whole.jsonl"], work)
        prefix = command(cli + ["demo", "--seed", "171", "--steps", "53",
            "--explore", "0.37", "--state", "split.state"], work)
        suffix = command(cli + ["resume", "split.state", "--steps", "96",
            "--explore", "0.37"], work)
        if uninterrupted.stdout != prefix.stdout + suffix.stdout:
            raise RuntimeError("CLI resumed JSON trace differs from uninterrupted trace")
        if (work / "whole.state").read_bytes() != (work / "split.state").read_bytes():
            raise RuntimeError("CLI resumed final state differs from uninterrupted state")
        if (work / "whole.jsonl").read_text() != uninterrupted.stdout:
            raise RuntimeError("CLI --trace differs from emitted stdout")
        records = [json.loads(line) for line in uninterrupted.stdout.splitlines()]
        if [record["tick"] for record in records] != list(range(1, 150)):
            raise RuntimeError("CLI JSON chronology does not cover all transitions")
        if records[0]["influence"] != [0, 0]:
            raise RuntimeError("First decision trace reports influence learned only afterward")
        report["checks"].append("CLI exact split continuation and JSONL chronology")
        scar = command(cli + ["scar", "past.state", "future.state", "cli-scar.state"], work)
        if json.loads(scar.stdout).get("scar") is not True:
            raise RuntimeError("CLI scar did not report a valid scar operation")
        if (work / "cli-scar.state").read_bytes() != (work / "scar.state").read_bytes():
            raise RuntimeError("CLI scar differs from in-process scar")
        command(cli + ["scar", "past.state", "other-birth.state", "invalid-scar.state"],
                work, expect=1)
        if (work / "invalid-scar.state").exists():
            raise RuntimeError("Rejected CLI scar created an output snapshot")
        report["checks"].append("CLI scar parity and unrelated-origin rejection")
        for invalid in (["demo", "--steps", "-1"], ["demo", "--explore", "nan"],
                        ["resume", "missing.state"]):
            command(cli + invalid, work, expect=1)
        frozen = command(cli + ["demo", "--steps", "7", "--frozen"], work)
        if any(json.loads(line)["updates"] != 0 for line in frozen.stdout.splitlines()):
            raise RuntimeError("Frozen CLI execution acquired readout updates")
        report["checks"].append("CLI invalid inputs and frozen-learning switch")
        intervention = command(cli + ["resume", "checkpoint.state", "--steps", "0",
            "--reverse-body", "--state", "intervened.state"], work)
        if intervention.stdout:
            raise RuntimeError("Zero-step body intervention emitted a simulated transition")
        command([str(binary), "body-reversal", "checkpoint.state", "intervened.state"], work)
        command(cli + ["resume", "intervened.state", "--steps", "0", "--reverse-body",
                       "--state", "twice-reversed.state"], work)
        if (work / "checkpoint.state").read_bytes() != (work / "twice-reversed.state").read_bytes():
            raise RuntimeError("Two zero-step body reversals did not restore the exact original state")
        report["checks"].append("CLI body reversal changes only actuator polarity; double reversal exact")
        data = (work / "checkpoint.state").read_bytes()
        malformed = {
            "empty": b"",
            "truncated-header": data[:7],
            "truncated-payload": data[:-1],
            "appended-data": data + b"unexpected",
            "tampered-header": bytes([data[0] ^ 0x80]) + data[1:],
            "tampered-payload": data[:len(data) // 2]
                + bytes([data[len(data) // 2] ^ 0x40]) + data[len(data) // 2 + 1:],
        }
        for name, corrupted in malformed.items():
            path = work / (name + ".state")
            path.write_bytes(corrupted)
            command([str(binary), "reject", str(path)], work)
            report["checks"].append(name + " rejected atomically")
        for name, define, mode in (
            ("reset-restored-rng", "MUTATE_RESTORE_RNG", "replay"),
            ("scar-noop", "MUTATE_SCAR_NOOP", "scar"),
            ("scar-future-world-leak", "MUTATE_SCAR_WORLD", "scar"),
        ):
            mutant = build("mutant-" + name, ["-D" + define])
            result = command([str(mutant), mode], work, expect=1)
            if "CONTRACT FAILURE:" not in result.stderr:
                raise RuntimeError("Mutation failed outside the intended contract: " + result.stderr)
            report["red_controls"].append({"mutation": name, "detected": result.stderr.strip()})
        if not args.no_sanitize:
            sanitizer = build("contracts-sanitized", ["-g", "-fsanitize=address,undefined",
                                                       "-fno-omit-frame-pointer"])
            env = dict(os.environ, ASAN_OPTIONS="detect_leaks=1:halt_on_error=1",
                       UBSAN_OPTIONS="halt_on_error=1:print_stacktrace=1")
            probe = subprocess.run([str(sanitizer), "replay"], cwd=work, env=env,
                                   text=True, capture_output=True)
            if (probe.returncode != 0
                    and "LeakSanitizer has encountered a fatal error" in probe.stderr
                    and "does not work under ptrace" in probe.stderr):
                env["ASAN_OPTIONS"] = "detect_leaks=0:halt_on_error=1"
                report["sanitizer_limit"] = "LeakSanitizer unavailable: runtime executes under ptrace"
            elif probe.returncode != 0:
                raise RuntimeError("Sanitizer replay failed:\n" + probe.stdout + probe.stderr)
            else:
                report["leak_sanitizer"] = "pass"
            for mode in ("replay", "scar"):
                command([str(sanitizer), mode], work, env=env)
            command([str(sanitizer), "body-reversal", "checkpoint.state", "intervened.state"],
                    work, env=env)
            for name in malformed:
                command([str(sanitizer), "reject", str(work / (name + ".state"))], work, env=env)
            report["checks"].append("AddressSanitizer + UndefinedBehaviorSanitizer")
        report["snapshot_bytes"] = len(data)
    if hashlib.sha256(source.read_bytes()).hexdigest() != source_hash:
        raise RuntimeError("Source changed during contract testing; rerun on a stable revision")
    report["status"] = "pass"
    if args.json:
        print(json.dumps(report, indent=2))
    else:
        for check in report["checks"]:
            print("PASS", check)
        for control in report["red_controls"]:
            print("RED", control["mutation"], "->", control["detected"])
        print("PASS all contracts; snapshot bytes:", report["snapshot_bytes"])
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except (OSError, RuntimeError) as error:
        print(str(error), file=sys.stderr)
        sys.exit(1)

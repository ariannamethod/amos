#!/usr/bin/env python3
"""Measure AMOS without JSON trace I/O; only Python's standard library is used."""
import json
import hashlib
import os
from pathlib import Path
import platform
import shlex
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parent
HARNESS = r'''
#define AMOS_NO_MAIN
#include "amos.c"
#include <time.h>
int main(int argc, char **argv) {
    Snapshot *s=malloc(sizeof *s);
    clock_t start,end,init_end;
    unsigned i,steps=20000;
    unsigned long rss=0;
    if(!s) return 1;
    (void)argv;
    start=clock();
    if(argc>1) snapshot_sequence(s,2026,!strcmp(argv[1],"events")?GLYPH_EVENTS:GLYPH_SEQUENCE);
    else snapshot_init(s,2026,AMOS_NORMAL);
    init_end=clock();
    for(i=0;i<steps;i++) snapshot_step(s,NAN,1,.25,NULL);
    end=clock();
    if(!snapshot_save(s,"measure.state")) return 2;
#ifdef __linux__
    { FILE *status=fopen("/proc/self/status","r"); char line[256];
      if(status) { while(fgets(line,sizeof line,status)) {
        if(sscanf(line,"VmHWM: %lu kB",&rss)==1) break; }
        fclose(status); } }
#endif
    printf("{\"steps\":%u,\"initialization_us\":%.6f,\"step_cpu_us\":%.6f,"
           "\"subject_bytes\":%zu,\"snapshot_memory_bytes\":%zu,\"native_peak_rss_kib\":%lu}",steps,
           1e6*(init_end-start)/CLOCKS_PER_SEC,
           1e6*(end-init_end)/(CLOCKS_PER_SEC*(double)steps),sizeof(Subject),sizeof(Snapshot),rss);
    free(s); return 0;
}
'''


def main():
    compiler=shlex.split(os.environ.get("CC","cc"))
    flags=["-O2","-std=c99","-Wall","-Wextra","-Wpedantic"]
    subprocess.run(compiler+flags+[str(ROOT/"amos.c"),"-lm","-o",str(ROOT/"amos")],check=True)
    measurements={}
    with tempfile.TemporaryDirectory(prefix="amos-measure-") as tmp:
        work=Path(tmp)
        (work/"bench.c").write_text(HARNESS)
        subprocess.run(compiler+flags+["-Wno-unused-function","-I",str(ROOT),
                       str(work/"bench.c"),"-lm","-o",str(work/"bench")],check=True)
        for name in ("inertial", "sequence", "events"):
            cmd=[str(work/"bench")]+([name] if name!="inertial" else [])
            rss_file=work/"rss.txt"
            if platform.system()=="Linux" and Path("/usr/bin/time").exists():
                cmd=["/usr/bin/time","-f","%M","-o",str(rss_file)]+cmd
            run=subprocess.run(cmd,cwd=work,capture_output=True,text=True,check=True)
            result=json.loads(run.stdout)
            result["peak_rss_kib"]=result.pop("native_peak_rss_kib") or (int(rss_file.read_text()) if rss_file.exists() else None)
            result["snapshot_file_bytes"]=(work/"measure.state").stat().st_size
            measurements[name]=result
    result={"worlds":measurements}
    result["source_sha256"]=hashlib.sha256((ROOT/"amos.c").read_bytes()).hexdigest()
    result["source_lines"]=len((ROOT/"amos.c").read_text().splitlines())
    result["source_bytes"]=(ROOT/"amos.c").stat().st_size
    result["executable_bytes"]=(ROOT/"amos").stat().st_size
    result["platform"]=platform.platform()
    result["compiler"]=subprocess.check_output(compiler+["--version"],text=True).splitlines()[0]
    result["flags"]=flags
    result["scope"]="One process, online RLS+planning+world step+ring memory; excludes trace I/O and state serialization from step timing."
    (ROOT/"reports").mkdir(exist_ok=True)
    (ROOT/"reports"/"performance.json").write_text(json.dumps(result,indent=2)+"\n")
    print(json.dumps(result,indent=2))


if __name__=="__main__":
    main()

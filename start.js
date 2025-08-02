import * as child_process from "node:child_process";

const goApi = child_process.spawn("/app/main");
goApi.stdout.pipe(process.stdout);
goApi.stderr.pipe(process.stderr);
import "./.next/standalone/server.js";

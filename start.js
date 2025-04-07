import { spawn } from "child_process";
const goApi = spawn("/app/main");
goApi.stdout.pipe(process.stdout);
goApi.stderr.pipe(process.stderr);
import "./.next/standalone/server.js";

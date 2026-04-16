/**
 * Start Flask from `backend/` using the first Python that exists on PATH (Windows-friendly).
 */
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const backend = path.join(root, "backend");

function commandExists(cmd) {
  const check =
    process.platform === "win32"
      ? `where ${cmd} >nul 2>nul`
      : `command -v ${cmd} >/dev/null 2>&1`;
  return spawnSync(check, { shell: true, stdio: "ignore" }).status === 0;
}

/** @type {Array<{ run: string }>} */
const candidates =
  process.platform === "win32"
    ? [
        { run: "python run.py" },
        { run: "py -3 run.py" },
        { run: "python3 run.py" },
      ]
    : [{ run: "python3 run.py" }, { run: "python run.py" }];

for (const { run } of candidates) {
  const exe = run.split(" ")[0];
  if (!commandExists(exe)) continue;

  const result = spawnSync(run, {
    cwd: backend,
    stdio: "inherit",
    shell: true,
    env: process.env,
  });
  process.exit(result.status ?? 1);
}

console.error(
  "\nCould not run Flask: no Python executable found on PATH.\n" +
    '  Install Python 3 from https://www.python.org/downloads/ and tick "Add python.exe to PATH",\n' +
    "  then restart the terminal. Or from the backend folder run:  python run.py\n",
);
process.exit(1);

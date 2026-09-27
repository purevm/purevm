import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";

// Integration tests read endpoints from the monorepo root `.env` when it exists, so local runs
// need no extra flags. In CI the variables come from the environment instead.
const envFile = new URL("../../.env", import.meta.url);
if (existsSync(envFile)) loadEnvFile(envFile);

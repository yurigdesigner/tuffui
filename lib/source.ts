import { readFile } from "node:fs/promises";
import path from "node:path";

/** Reads a registry file so the Code tab always shows exactly what gets installed. */
export async function readRegistryFile(file: string) {
  return readFile(path.join(process.cwd(), "registry", file), "utf8");
}

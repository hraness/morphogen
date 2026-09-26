import { describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { COMMAND_NAMES } from "./cli-help";
import packageJson from "../package.json" with { type: "json" };

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CLI = join(ROOT, "cli.ts");

function run(args: string[], env: Record<string, string | undefined> = {}) {
  const result = spawnSync(process.execPath, [CLI, ...args], {
    cwd: ROOT,
    timeout: 20_000,
    env: { PATH: process.env.PATH ?? "", LANG: "en_US.UTF-8", HRANESS_AUDIENCE: "human", ...env },
  });
  return { status: result.status, stdout: result.stdout.toString(), stderr: result.stderr.toString() };
}
const lines = (text: string) => text.trimEnd().split("\n");
const width = (text: string) => Math.max(...lines(text).map((line) => line.length));

describe("morphogen CLI help", () => {
  test("bare invocation is a short start screen that points to ALGAL", () => {
    const result = run([]);
    expect(result.status).toBe(0);
    expect(result.stderr).toBe("");
    expect(lines(result.stdout).length).toBeLessThanOrEqual(25);
    expect(width(result.stdout)).toBeLessThanOrEqual(80);
    expect(result.stdout).toBe(`Typed, replayable workflows for AI agents.
⚠ Morphogen is the earlier prototype of ALGAL. New work should use ALGAL:
  https://algal.computer

Start here
  morphogen examples               List the bundled example workflows
  morphogen example <id>           Print one example's manifest
  morphogen run <manifest.json>    Run a workflow and print its run record
  morphogen verify <record.json>   Replay a run record offline and compare

All commands: morphogen --help
morphogen ${packageJson.version}
`);
  });

  test("root help is grouped, at most 60 lines, and names ALGAL", () => {
    for (const flag of ["--help", "-h", "help"]) {
      const result = run([flag]);
      expect(result.status).toBe(0);
      expect(lines(result.stdout)[0]).toBe("Usage: morphogen <command> [options]");
      expect(result.stdout).toContain("Morphogen is the earlier prototype of ALGAL");
      expect(lines(result.stdout).length).toBeLessThanOrEqual(60);
      expect(width(result.stdout)).toBeLessThanOrEqual(80);
      expect(result.stdout).not.toMatch(/\b(admit|admission|organism|CAS)\b/);
    }
  });

  test("every command has help that exits 0 and fits 80 columns", () => {
    for (const command of COMMAND_NAMES) {
      const forms = [[command, "--help"], [command, "-h"], ["help", command]];
      const outputs = forms.map((args) => run(args));
      for (const result of outputs) {
        expect(result.status).toBe(0);
        expect(result.stdout.startsWith("Usage: morphogen ")).toBe(true);
        expect(result.stdout).toBe(outputs[0]!.stdout);
      }
      expect(width(outputs[0]!.stdout)).toBeLessThanOrEqual(80);
    }
    expect(run(["help", "advanced"]).stdout).toContain("foundry <config.json>");
  }, 120_000);

  test("--version prints the bin name and version; --json keeps the object", () => {
    for (const flag of ["--version", "-V", "version"]) {
      expect(run([flag]).stdout).toBe(`morphogen ${packageJson.version}\n`);
    }
    expect(JSON.parse(run(["--version", "--json"]).stdout)).toEqual({
      contract: "morphogen.organism.v1",
      name: "morphogen",
      version: packageJson.version,
    });
  });

  test("a closed pipe exits quietly", () => {
    const result = spawnSync("/bin/sh", ["-c", `"${process.execPath}" "${CLI}" --help | head -1`], { encoding: "utf8" });
    expect(result.status).toBe(0);
    expect(result.stdout).toBe("Usage: morphogen <command> [options]\n");
    expect(result.stderr).toBe("");
  });
});

describe("morphogen CLI errors", () => {
  test("an unknown command is named, with a suggestion and one next step", () => {
    const result = run(["rnu"]);
    expect(result.status).toBe(2);
    expect(result.stdout).toBe("");
    expect(result.stderr).toBe('✗ Unknown command "rnu". Did you mean "run"?\n→ morphogen --help\n');
  });

  test("missing arguments point at the command's help", () => {
    const result = run(["run"]);
    expect(result.status).toBe(2);
    expect(result.stderr).toBe("✗ Usage: morphogen run <manifest.json> [options]\n→ morphogen run --help\n");
  });

  test("a missing file says so in plain words", () => {
    const result = run(["inspect", "does-not-exist.json"]);
    expect(result.status).toBe(2);
    expect(result.stderr).toMatch(/^✗ No file at \S*does-not-exist\.json\.\n→ morphogen inspect --help\n$/);
  });

  test("--json and agents get one JSON error object on stdout", () => {
    const expected = {
      ok: false,
      error: { code: "PARSE_FAILED", message: 'Unknown command "rnu". Did you mean "run"?', next: "morphogen --help" },
    };
    for (const [args, env] of [
      [["rnu", "--json"], {}],
      [["rnu"], { HRANESS_AUDIENCE: undefined, CLAUDECODE: "1" }],
    ] as const) {
      const result = run([...args], env);
      expect(result.status).toBe(2);
      expect(result.stderr).toBe("");
      expect(JSON.parse(result.stdout)).toEqual(expected);
    }
  });

  test("NO_COLOR, non-TTY and ASCII terminals", () => {
    expect(run(["rnu"], { NO_COLOR: "1" }).stderr).not.toContain("\x1b[");
    expect(run(["rnu"], { HRANESS_AUDIENCE: "quiet" }).stderr).toStartWith("✗ Unknown command");
    expect(run(["rnu"], { TERM: "dumb" }).stderr).toBe('FAIL Unknown command "rnu". Did you mean "run"?\n-> morphogen --help\n');
    expect(run([], { HRANESS_ASCII: "1" }).stdout).toContain("WARN Morphogen is the earlier prototype of ALGAL");
    expect(run(["rnu"], { FORCE_COLOR: "1" }).stderr).toStartWith("\x1b[31m✗\x1b[0m Unknown");
  });
});

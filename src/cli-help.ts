// Help text for the morphogen CLI. Root help stays short; every command has
// its own block, printed by `morphogen <command> --help` or `morphogen help <command>`.

import { sym, type Env, type Stream } from "./cli-style";

export const NAME = "morphogen";

/** Morphogen is the earlier prototype of ALGAL; say so wherever help appears. */
export function algalNotice(stream: Stream, env: Env = process.env): string {
  return `${sym("warn", stream, env)} Morphogen is the earlier prototype of ALGAL. New work should use ALGAL:
  https://algal.computer
`;
}

const TAGLINE = "Typed, replayable workflows for AI agents.";

export function bareScreen(version: string, stream: Stream, env: Env = process.env): string {
  return `${TAGLINE}
${algalNotice(stream, env)}
Start here
  morphogen examples               List the bundled example workflows
  morphogen example <id>           Print one example's manifest
  morphogen run <manifest.json>    Run a workflow and print its run record
  morphogen verify <record.json>   Replay a run record offline and compare

All commands: morphogen --help
morphogen ${version}
`;
}

export function rootHelp(stream: Stream, env: Env = process.env): string {
  return `Usage: morphogen <command> [options]

${TAGLINE}
${algalNotice(stream, env)}
Start here
  examples                     List the bundled example workflows
  example <id>                 Print one example's manifest
  run <manifest.json>          Run a workflow and print its run record
  verify <record.json>         Replay a run record offline and compare

Check and inspect
  check <manifest.json>        Check a manifest without running it
  explain <manifest.json>      Print resolved inputs, outputs and guards
  inspect <record.json>        Summarize a run record
  diff <record-a> <record-b>   Show where two runs diverge
  runs                         List stored run records
  digest <manifest.json>       Print a manifest's content digest
  suite                        Run and verify every bundled example

Share
  pack <manifest.json>         Bundle a workflow with everything it uses
  unpack <bundle.json>         Install a bundle into the local store
  call <bundle.json>           Run a bundled workflow, print a short result
  tool-def <manifest.json>     Print a tool definition for model APIs

Options
  -h, --help       Show help (also: morphogen <command> --help)
  -V, --version    Show the version
  --dir <path>     Store folder (default .morphogen)

More commands: morphogen help advanced
`;
}

// One block per command. A run record is what the contract calls a receipt:
// the content-addressed record of every step a run took.
const COMMANDS: Record<string, string> = {
  examples: `Usage: morphogen examples

List the bundled example workflows.
`,
  example: `Usage: morphogen example <id>

Print one bundled example's manifest.

Example
  morphogen example approve
`,
  run: `Usage: morphogen run <manifest.json> [options]

Run a workflow and print its run record (receipt): the content-addressed
record of every step, which verify can replay offline.

Options
  --args <file>                  Input values (JSON)
  --responses <file>             Scripted model outputs (JSON map)
  --executor-cmd <command>       Live executor: request on stdin, output on
                                 stdout
  --gateway-model <provider/model>
                                 Use Vercel AI Gateway structured output
  --executors <file>             JSON map of executor name to shell command
  --modules <dir>                Load *.morphogen.json for nested workflows
  --transports <file>            JSON map of transport name to bundle folder
  --tools <file>                 Tool registry: name to {signature, exec}
  --dir <path>                   Store folder (default .morphogen)
  --write                        Save the manifest and run record in --dir
  --cache-effects                Reuse recorded responses for identical
                                 requests

Example
  morphogen run examples/approve.morphogen.json \\
    --args examples/approve.args.json \\
    --responses examples/approve.responses.json
`,
  check: `Usage: morphogen check <manifest.json> [options]

Check that a manifest is valid without running it.

Options
  --modules <dir>       Load *.morphogen.json for nested workflows
  --transports <file>   JSON map of transport name to bundle folder
  --dir <path>          Store folder (default .morphogen)
`,
  explain: `Usage: morphogen explain <manifest.json> [options]

Print the compiled signature: resolved inputs, outputs and guards. Takes the
same options as morphogen check.
`,
  verify: `Usage: morphogen verify <record.json> [manifest.json] [options]

Replay a run record with its recorded responses and compare. The manifest is
read from the store when you leave it out. Takes the same options as
morphogen check.
`,
  inspect: `Usage: morphogen inspect <record.json>

Summarize a run record.
`,
  runs: `Usage: morphogen runs [--dir <path>]

List the run records stored in --dir.
`,
  diff: `Usage: morphogen diff <record-a.json> <record-b.json>

Compare two run records and show where they diverge.
`,
  digest: `Usage: morphogen digest <manifest.json>

Print the manifest's canonical content digest.
`,
  suite: `Usage: morphogen suite

Run and verify every bundled example.
`,
  pack: `Usage: morphogen pack <manifest.json> [--modules <dir>] [--dir <path>]
                      [--out <dir>]

Print a bundle: the manifest plus every nested manifest and stored value it
uses. --out also writes <digest>.bundle.json.
`,
  unpack: `Usage: morphogen unpack <bundle.json> [--dir <path>]

Install a bundle into the store after checking its digests.
`,
  call: `Usage: morphogen call <bundle.json> [options]

Run a bundled workflow and print a short result:
{ ok, outputs, receiptDigest, manifestDigest }. Options match morphogen run.
`,
  "tool-def": `Usage: morphogen tool-def <manifest.json> [--modules <dir>]
                          [--format openai|anthropic]

Print a tool definition for the workflow: a name, a description and a JSON
Schema of the arguments it expects.
`,
  foundry: `Usage: morphogen foundry <config.json> [options] [--out <report.json>]
       morphogen foundry verify|inspect <report.json> [--dir <path>]
       morphogen foundry pack <report.json> --out <dir> [--dir <path>]
       morphogen foundry search <config.json> [options]
       morphogen foundry search-verify|search-inspect <report.json>
       morphogen foundry search-pack <report.json> --out <dir>

Generate candidate workflows, score them on test cases and keep the winner.
Options match morphogen run. search evolves candidates over several
generations. verify replays every run in a report offline.
`,
  bench: `Usage: morphogen bench <config.json> [--modules <dir>] [--tools <file>]
                       [--dir <path>] [--out <report.json>]
       morphogen bench verify|inspect <report.json> [--dir <path>]

Measure several systems on one workload: quality, tokens, work and cost per
model, and the set of systems no other system beats on every measure.
`,
  store: `Usage: morphogen store put <value.json> [--dir <path>]
       morphogen store get|has <sha256:...> [--dir <path>]

Write a JSON value to the content store and print its reference, or read one
back by reference.
`,
  slots: `Usage: morphogen slots [--dir <path>]

List the saved values of durable slot cells.
`,
  slot: `Usage: morphogen slot get <name> [--dir <path>]
       morphogen slot set <name> <value.json> [--dir <path>]

Read or seed one durable slot value.
`,
  manifests: `Usage: morphogen manifests [--dir <path>]

List the manifests stored in --dir.
`,
  manifest: `Usage: morphogen manifest <sha256:...> [--dir <path>]

Print one stored manifest.
`,
};

export const COMMAND_NAMES: readonly string[] = Object.keys(COMMANDS);

export function commandHelp(command: string): string | undefined {
  return Object.hasOwn(COMMANDS, command) ? COMMANDS[command] : undefined;
}

export function advancedHelp(): string {
  return `Usage: morphogen <command> [options]

Advanced commands
  foundry <config.json>        Generate and score candidate workflows
  bench <config.json>          Compare systems on one workload
  store put|get|has            Read and write the content store
  slots                        List durable slot values
  slot get|set <name>          Read or seed one slot value
  manifests                    List stored manifests
  manifest <sha256:...>        Print one stored manifest

Details: morphogen <command> --help
`;
}

#!/usr/bin/env node
/* eslint-disable prefer-const */
import fs from "fs";
import path from "path";
import findup from "findup-sync";
import yargs from "yargs";
import Parser from "yargs-parser";
import { hideBin } from "yargs/helpers";
import {
  builder as pluginBuilder,
  description as pluginDescription,
  handler as pluginHandler,
} from "./plugin/command.js";

export const scriptName = "defer-setup-redwoodjs";

let { cwd, help } = Parser(hideBin(process.argv));

cwd ??= process.env["RWJS_CWD"];

try {
  if (cwd) {
    // `cwd` was set by the `--cwd` option or the `RWJS_CWD` env var. In this case,
    // we don't want to find up for a `redwood.toml` file. The `redwood.toml` should just be in that directory.
    if (!fs.existsSync(path.join(cwd, "redwood.toml")) && !help) {
      throw new Error(`Couldn't find a "redwood.toml" file in ${cwd}`);
    }
  } else {
    // `cwd` wasn't set. Odds are they're in a Redwood project,
    // but they could be in ./api or ./web, so we have to find up to be sure.

    const redwoodTOMLPath = findup("redwood.toml", { cwd: process.cwd() });

    if (!redwoodTOMLPath && !help) {
      throw new Error(
        `Couldn't find up a "redwood.toml" file from ${process.cwd()}`
      );
    }

    if (redwoodTOMLPath) {
      cwd = path.dirname(redwoodTOMLPath);
    }
  }
} catch (error) {
  if (error instanceof Error) {
    console.error(error.message);
  }

  process.exit(1);
}

process.env["RWJS_CWD"] = cwd;

// export const command = 'plugin <command>';

yargs
  .demandCommand()
  .scriptName(scriptName)
  .option("cwd", {
    type: "string",
    demandOption: false,
    description: "Working directory to use (where `redwood.toml` is located)",
  })
  // default command
  .command("$0", pluginDescription, pluginBuilder, pluginHandler)
  .parse();

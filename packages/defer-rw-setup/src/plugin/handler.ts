import { colors } from "@redwoodjs/cli-helpers";

import { tasks as setupPluginTasks } from "./tasks.js";
import { ForceOptions } from "./command.js";

interface ErrorWithExitCode extends Error {
  exitCode?: number;
}

function isErrorWithExitCode(e: unknown): e is ErrorWithExitCode {
  return typeof (e as ErrorWithExitCode)?.exitCode !== "undefined";
}

export const handler = async ({ cwd, force }: ForceOptions) => {
  const tasks = setupPluginTasks({ cwd, force });

  try {
    await tasks.run();
  } catch (e) {
    if (e instanceof Error) {
      console.error(colors.error(e.message));
    } else {
      console.error(colors.error("Unknown error when running yargs tasks"));
    }

    if (isErrorWithExitCode(e)) {
      process.exit(e.exitCode);
    }

    process.exit(1);
  }
};

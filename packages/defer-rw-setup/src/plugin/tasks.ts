import path from "path";
import execa from "execa";
import { Listr } from "listr2";
import fs from "fs-extra";
import { getConfigPath } from "@redwoodjs/project-config";

import type { ForceOptions } from "./command";
import { getPaths, writeFile } from "../cli-helpers.js";

export const tasks = (options: ForceOptions) => {
  const SRC_DEFER_PATH = path.join(getPaths().api.src, "jobs", "defer");
  const SRC_DEFER_CLIENT_PATH_FILE = path.join(
    getPaths().api.src,
    "jobs",
    "clients",
    "defer.ts"
  );

  const commandPaths = {
    SRC_DEFER_PATH,
    SRC_DEFER_CLIENT_PATH_FILE,
  };

  const existingFiles = options.force ? "OVERWRITE" : "FAIL";

  return new Listr(
    [
      {
        title: "Install Defer packages ...",
        task: () => {
          execa.commandSync(
            "yarn workspace api add @defer/client",
            process.env["RWJS_CWD"]
              ? {
                  cwd: process.env["RWJS_CWD"],
                }
              : {}
          );
        },
      },
      {
        title: "Adding config to redwood.toml...",
        task: () => {
          updateTomlConfig();
        },
      },
      {
        title: "Configure Defer client ...",
        task: () => {
          configureDeferClient({ commandPaths, existingFiles });
        },
      },
      {
        title: "Add Defer helloWorld function example ...",
        task: () => {
          addDeferHelloWorldExampleTask({ commandPaths, existingFiles });
        },
      },
    ],
    { rendererOptions: {} }
  );
};

export const addDeferHelloWorldExampleTask = ({
  commandPaths,
  existingFiles,
}: {
  commandPaths: Record<string, string>;
  existingFiles: "OVERWRITE" | "FAIL";
}) => {
  // save example Defer function in the defer folder
  fs.ensureDirSync(commandPaths["SRC_DEFER_PATH"]!);

  const deferHelloWorldTemplate = `// the defer() helper will be used to define a background function
import { defer } from 'src/jobs/clients/defer'
import { logger } from 'src/lib/logger'

const sleep = (seconds: number) =>
  new Promise<void>((resolve) => {
    setTimeout(() => {
      resolve()
    }, seconds)
  })

// a background function must be async
const helloWorld = async (name: string) => {
  await sleep(10)
  logger.info(\`Hello \${name}!\`)
}

// the function must be wrapped with defer() and exported as default
export default defer(helloWorld, {
  // retry: 5,
  // concurrency: 10,
  // maxDuration: 5 * 60 // in seconds
})
`;

  return writeFile(
    path.join(commandPaths["SRC_DEFER_PATH"]!, "helloWorld.ts"),
    deferHelloWorldTemplate,
    {
      existingFiles,
    }
  );
};

export const configureDeferClient = ({
  commandPaths,
  existingFiles,
}: {
  commandPaths: Record<string, string>;
  existingFiles: "OVERWRITE" | "FAIL";
}) => {
  const deferHelloWorldTemplate = `export { defer, addMetadata, delay, getExecution } from '@defer/client'
`;

  return writeFile(
    commandPaths["SRC_DEFER_CLIENT_PATH_FILE"]!,
    deferHelloWorldTemplate,
    {
      existingFiles,
    }
  );
};

export const updateTomlConfig = () => {
  const redwoodTomlPath = getConfigPath();
  const configContent = fs.readFileSync(redwoodTomlPath, "utf-8");

  if (!configContent.includes("@defer/redwood")) {
    if (configContent.includes("[experimental.cli]")) {
      if (configContent.includes("  [[experimental.cli.plugins]]")) {
        writeFile(
          redwoodTomlPath,
          configContent.replace(
            "  [[experimental.cli.plugins]]",
            `
  [[experimental.cli.plugins]]
    package = "@defer/redwood"

  [[experimental.cli.plugins]]`
          ),
          {
            existingFiles: "OVERWRITE",
          }
        );
      } else {
        if (
          configContent.match(`[experimental.cli]
  autoInstall = true`)
        ) {
          writeFile(
            redwoodTomlPath,
            configContent.replace(
              `[experimental.cli]
  autoInstall = true`,
              `
[experimental.cli]
  autoInstall = true

  [[experimental.cli.plugins]]
    package = "@defer/redwood"`
            ),
            {
              existingFiles: "OVERWRITE",
            }
          );
        } else {
          writeFile(
            redwoodTomlPath,
            configContent.replace(
              `[experimental.cli]
  autoInstall = false`,
              `
[experimental.cli]
  autoInstall = false

  [[experimental.cli.plugins]]
    package = "@defer/redwood"`
            ),
            {
              existingFiles: "OVERWRITE",
            }
          );
        }
      }
    } else {
      writeFile(
        redwoodTomlPath,
        configContent.concat(`
[experimental.cli]
  autoInstall = true

  [[experimental.cli.plugins]]
    package = "@defer/redwood"`),
        {
          existingFiles: "OVERWRITE",
        }
      );
    }
  }
};

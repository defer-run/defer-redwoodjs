import path from "path";
import execa from "execa";
import { Listr } from "listr2";
import fs from "fs-extra";
import { getPaths, writeFile } from "@redwoodjs/cli-helpers";
import { getConfigPath } from "@redwoodjs/project-config";

import type { ForceOptions } from "./command";

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

  const deferHelloWorldTemplate = fs.readFileSync(
    path.resolve(
      __dirname,
      "..",
      "..",
      "templates",
      "plugin",
      "helloWorld.ts.template"
    ),
    "utf-8"
  );

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
  const deferHelloWorldTemplate = fs.readFileSync(
    path.resolve(
      __dirname,
      "..",
      "..",
      "templates",
      "plugin",
      "client.ts.template"
    ),
    "utf-8"
  );

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
              "[experimental.cli]",
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
              "[experimental.cli]",
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
  autoInstall = false
  [[experimental.cli.plugins]]
    package = "@defer/redwood"`),
        {
          existingFiles: "OVERWRITE",
        }
      );
    }
  }
};

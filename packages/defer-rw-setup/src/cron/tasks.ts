import path from "path";
import { Listr } from "listr2";
import fs from "fs-extra";
import { camelCase } from "camel-case";
import { getPaths, writeFile } from "@redwoodjs/cli-helpers";
import "../dirname.js";

import type { FunctionOptions } from "./command";

export const tasks = (options: FunctionOptions) => {
  const PACKAGE_JSON_PATH = path.join(getPaths().api.base, "package.json");
  const SRC_DEFER_PATH = path.join(getPaths().api.src, "jobs", "defer");
  const SRC_DEFER_CLIENT_PATH_FILE = path.join(
    getPaths().api.src,
    "jobs",
    "clients",
    "defer.ts"
  );

  const commandPaths = {
    PACKAGE_JSON_PATH,
    SRC_DEFER_PATH,
    SRC_DEFER_CLIENT_PATH_FILE,
  };

  const existingFiles = options.force ? "OVERWRITE" : "FAIL";

  return new Listr(
    [
      {
        title: "Check Defer is properly configured ...",
        task: () => {
          const pkg = JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH, "utf-8"));

          if (
            !Object.keys(pkg.dependencies || {}).includes("@defer/client") ||
            !fs.existsSync(SRC_DEFER_CLIENT_PATH_FILE)
          ) {
            throw new Error(
              "Please setup Defer before creating a background function."
            );
          }
        },
      },
      {
        title: `Create ${camelCase(options.name!)} CRON ...`,
        task: () => {
          createCronTask({
            commandPaths,
            existingFiles,
            name: options.name!,
          });
        },
      },
    ],
    { rendererOptions: {} }
  );
};

export const createCronTask = ({
  commandPaths,
  existingFiles,
  name,
}: {
  commandPaths: Record<string, string>;
  existingFiles: "OVERWRITE" | "FAIL";
  name: string;
}) => {
  fs.ensureDirSync(commandPaths["SRC_DEFER_PATH"]!);

  const deferCronTemplate = `import { defer } from '@defer/client'

  async function sendMondayNewsletter() {
    // TODO
  }
  
  export default defer.cron(sendMondayNewsletter, '0 0 * * MON')

`;

  return writeFile(
    path.join(commandPaths["SRC_DEFER_PATH"]!, `${camelCase(name)}.ts`),
    deferCronTemplate.replace(/sendMondayNewsletter/g, camelCase(name)),
    {
      existingFiles,
    }
  );
};

import path from "path";
import { Listr } from "listr2";
import fs from "fs-extra";
import { camelCase } from "camel-case";

import type { FunctionOptions } from "./command";
import { getPaths, writeFile } from "../cli-helpers.js";

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
        title: `Create ${camelCase(options.name!)} background function ...`,
        task: () => {
          createBackgroundFunctionTask({
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

export const createBackgroundFunctionTask = ({
  commandPaths,
  existingFiles,
  name,
}: {
  commandPaths: Record<string, string>;
  existingFiles: "OVERWRITE" | "FAIL";
  name: string;
}) => {
  fs.ensureDirSync(commandPaths["SRC_DEFER_PATH"]!);

  const deferHelloWorldTemplate = `import { defer } from 'src/jobs/clients/defer'

const helloWorld = async () => {
  // TODO
}

export default defer(helloWorld, {
  // retry: 5,
  // concurrency: 10,
  // maxDuration: 5 * 60 // in seconds
})
`;

  return writeFile(
    path.join(commandPaths["SRC_DEFER_PATH"]!, `${camelCase(name)}.ts`),
    deferHelloWorldTemplate.replace(/helloWorld/g, camelCase(name)),
    {
      existingFiles,
    }
  );
};

import type Yargs from "yargs";

interface BaseOptions {
  cwd: string | undefined;
}

export interface FunctionOptions extends BaseOptions {
  force: boolean;
  name?: string;
}

export const description = "Add a Defer background function";

export const builder = (yargs: Yargs.Argv<BaseOptions>) => {
  return yargs
    .option("force", {
      alias: "f",
      default: false,
      description: "Overwrite existing files",
      type: "boolean",
    })
    .option("name", {
      alias: "n",
      default: "helloWorld",
      description: "Background function name",
      type: "string",
    });
};

export const handler = async (options: FunctionOptions) => {
  const { handler } = await import("./handler.js");
  return handler(options);
};

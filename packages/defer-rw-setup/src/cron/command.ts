import type Yargs from "yargs";

export interface BaseOptions {
  cwd: string | undefined;
}

export interface FunctionOptions extends BaseOptions {
  force: boolean;
  name?: string;
}

export const command = "cron <name>";

export const description = "Add a Defer CRON";

export const builder = (yargs: Yargs.Argv<BaseOptions>) => {
  return yargs
    .commandDir("cron")
    .option("force", {
      alias: "f",
      default: false,
      description: "Overwrite existing files",
      type: "boolean",
    })
    .option("name", {
      alias: "n",
      default: "sendMondayNewsletter",
      description: "CRON name",
      type: "string",
    });
};

export const handler = async (options: FunctionOptions) => {
  const { handler } = await import("./handler.js");
  return handler(options);
};

#!/usr/bin/env node

import { program } from "commander";
import { runExport } from "./index";

const bootstrap = () => {
  program
    .version(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-var-requires
      require("../package.json").version,
      "-v, --version",
      "Output the current version."
    )
    .usage("<command> [options]")
    .helpOption("-h, --help", "Output usage information.");

  program.command("export").action(() => {
    // str, option
    const mongoUri = "";

    return runExport(
      {
        collection: "Test",
        query: "",
      },
      mongoUri,
      process.cwd(),
      `${process.cwd()}/relations.yml`
    );
  });

  program.parse(process.argv);

  if (!process.argv.slice(2).length) {
    program.outputHelp();
  }
};

bootstrap();

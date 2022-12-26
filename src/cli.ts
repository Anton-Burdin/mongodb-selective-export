#!/usr/bin/env node

import path from "path";
import { program } from "commander";
import { version as PackageVersion } from "../package.json";
import { runExport } from "./index";

const bootstrap = () => {
  program
    .version(PackageVersion, "-v, --version", "Output the current version.")
    .usage("<command> [options]")
    .helpOption("-h, --help", "Output usage information.");

  program
    .command("export")
    .requiredOption("-u, --uri <uri>", "MongoDB connection string")
    .option("-r, --relations <file>", "Path to relation file", "relations.yml")
    .argument(
      "<JSONentryPoints>",
      "{collection: string; query: mongodbQuery} | {collection: string; query: mongodbQuery}[]"
    )
    .action(
      (
        jsonEntryPoints: string,
        {
          uri: mongoUri,
          relations: relationsFile,
        }: { uri: string; relations: string }
      ) => {
        const data: unknown = JSON.parse(jsonEntryPoints);
        const entryPoints = (Array.isArray(data) ? data : [data]).map(
          ({ collection, query }: { collection: string; query: unknown }) => ({
            collection,
            query: JSON.stringify(query),
          })
        );

        return runExport(
          entryPoints,
          mongoUri,
          process.cwd(),
          path.resolve(process.cwd(), relationsFile)
        );
      }
    );

  program.parse(process.argv);

  if (!process.argv.slice(2).length) {
    program.outputHelp();
  }
};

bootstrap();

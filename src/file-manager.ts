import { createReadStream } from "fs";
import { access, mkdir, readdir, writeFile, readFile } from "fs/promises";
import { join } from "path";
import yaml from "js-yaml";
import { Logger } from "pino";
import split2 from "split2";
import { IDoc, IExportQuery } from "./mongo-export";
import { IRelation } from "./relations";

export const loadExportedDocuments = async (
  collectionsFolder: string,
  eachDoc: (collection: string, doc: IDoc) => void,
  logger: Logger
) => {
  const collections = await readdir(collectionsFolder);

  for (const collection of collections) {
    await new Promise<void>((resolve) => {
      createReadStream(join(collectionsFolder, collection), { autoClose: true })
        .pipe(split2(JSON.parse))
        .on("data", (doc: IDoc) => eachDoc(collection, doc))
        .on("end", () => resolve())
        // TODO: improve
        .on("error", (error) => logger.error(error));
    });
  }
};

export const creteFolder = async (fullPathFolder: string): Promise<boolean> => {
  return access(fullPathFolder)
    .then(() => false)
    .catch(() => {
      return mkdir(fullPathFolder, { recursive: true }).then(() => true);
    });
};

export const saveQueries = async (
  fullPath: string,
  queries: IExportQuery[],
  logger: Logger
) => {
  return writeFile(
    join(fullPath, "queriesInProgress.json"),
    JSON.stringify(queries),
    { encoding: "utf8", flag: "w" }
  ).catch((err) => {
    logger.error(err);
  });
};

export const loadSRelationSchema = async (ymlFile: string) => {
  const ymlContent = await readFile(ymlFile, "utf8");
  const data = yaml.load(ymlContent) as Record<string, IRelation[]>;

  // todo: validate relations

  return data;
};

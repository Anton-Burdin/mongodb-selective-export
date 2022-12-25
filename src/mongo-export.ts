import { spawn } from "child_process";
import { createWriteStream } from "fs";
import { Logger } from "pino";
import split2 from "split2";
import { IDocRelation } from "./doc-extractor";

export interface ObjectId {
  $oid: string;
}
export const ObjectId = {
  fromString: (v: string): ObjectId => ({ $oid: v }),
  toString: (v: ObjectId): string => v.$oid,
};

export type IDoc = Record<string, unknown> & { _id: ObjectId };

export const exportDocumentsFromCollection = (
  options: {
    collection: string;
    query: string;
    mongoUri: string;
    exportFolder: string;
  },
  documentDeduplicator: Set<string>,
  eachNewDocCb: (object: IDoc) => void,
  parentLogger: Logger
): Promise<void> => {
  const { collection, query, mongoUri, exportFolder } = options;
  const logger = parentLogger.child({
    fnStack: ["mongoexport"],
  });

  let totalCount = 0;
  let payloadCount = 0;

  return new Promise((resolve) => {
    const ls = spawn("mongoexport", [
      `-c=${collection}`,
      `--query=${query}`,
      `--uri=${mongoUri}`,
    ]);

    const writeStream = createWriteStream(
      `${exportFolder}/${collection}.json`,
      { flags: "a" } // append
    );

    // Readline
    ls.stdout.pipe(split2(JSON.parse), )
        .on("data",  (doc: IDoc) => {
          totalCount++;

          if (!documentDeduplicator.has(`${collection}.${ObjectId.toString(doc._id)}`)) {
            payloadCount++;
            eachNewDocCb(doc);
            writeStream.write(`${JSON.stringify(doc)}\n`);
          }
        })
        .on("error", (e) => {
          logger.error(e);
    });

    ls.on("exit", (code) => {
      if (Number(code) === 1) {
        ls.stderr.on("data", (data: Buffer) => {
          logger.error(data.toString(), `${collection} stderr`);
        });
      }
      logger.info(
          `Exported ${collection}: payloadCount: ${payloadCount} totalCount: ${totalCount}`
      );
      writeStream.end();
      resolve();
    });
  });
};

export interface IExportQuery {
  collection: string;
  query: string;
}

export const formExportQueriesFromCollectionRelations = (
  collectionRelations: IDocRelation[],
): IExportQuery[] => {
  // grouped and deduplicate queries
  const groupedQueries = collectionRelations.reduce<
    Record<string, Record<string, string[]>>
  >((acc, docRelation) => {
    const { collection, path: filed, value } = docRelation;
    const groupByCollection =
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      acc[collection] || (acc[collection] = {} as Record<string, string[]>);
    const groupByFiled =
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      groupByCollection[filed] || (groupByCollection[filed] = [] as string[]);

    if (!groupByFiled.find((v) => v === value)) {
      groupByFiled.push(value as string);
    }

    return acc;
  }, {});

  return Object.keys(groupedQueries).map((collection) => {
    const groupedField = groupedQueries[collection];

    const fieldQueries = Object.keys(groupedField).map((path) => ({
      [path]: { $in: groupedField[path].map(ObjectId.fromString) },
    }));

    const query =
        fieldQueries.length === 1 ? fieldQueries[0] : { $or: fieldQueries };

    return {
      collection,
      query: JSON.stringify(query),
    } as IExportQuery;
  });
};

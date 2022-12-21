import { Logger } from "pino";
import { IDoc, ObjectId } from "./mongo-export";
import { IRelation } from "./relations";

const isPrimitive = (inputValue: unknown) => inputValue !== Object(inputValue);
const isString = (str: unknown) =>
  str !== undefined && str !== null && typeof str.valueOf() === "string";

export const extractObjectIdsFromDocument = <T extends Record<string, any>>(
  document: T
) => {
  const output: { path: string; id: string }[] = [];

  const fieldsForScan: { path: string; obj: T }[] = [
    { path: "", obj: document },
  ];

  while (fieldsForScan.length) {
    const { path: parentPath, obj } = fieldsForScan.pop()!;

    Object.keys(obj).forEach((key) => {
      if (isPrimitive(obj[key])) {
        if (key === "$oid" && isString(obj[key])) {
          output.push({ path: parentPath, id: obj[key] as string });
        }
      } else {
        fieldsForScan.push({
          path: `${parentPath}${
            Array.isArray(obj)
              ? "[" + key + "]"
              : parentPath.length
              ? "." + key
              : key
          }`,
          obj: obj[key] as T,
        });
      }
    });
  }

  return output;
};

export interface IDocRelation {
  collection: string;
  path: string;
  // todo: now only objectId, change later
  value: unknown;
}

export const extractRelationsFromDoc = (
  document: IDoc,
  collection: string,
  relationSchema: Map<string, IRelation[]>,
  logger: Logger
): IDocRelation[] => {
  const objectIds = extractObjectIdsFromDocument(document);

  const curRelationSchema = relationSchema.get(collection) ?? [];

  return objectIds
    .map((item) => {
      // for array
      // todo: improve
      const field = item.path.indexOf("[")
        ? item.path.replace(/\[\d+\]/i, "")
        : item.path;

      const docRelations = curRelationSchema
        .filter((rel) => rel.field === field)
        .map(
          (rel) =>
            ({
              collection: rel.to,
              path: rel.toField,
              value: item.id,
            } as IDocRelation)
        );

      if (!docRelations.length && item.path !== "_id") {
        logger.warn(
          `Collection ${collection}[${ObjectId.toString(document._id)}].${
            item.path
          } without relation schema`
        );
      }

      return docRelations;
    })
    .flat(1);
};

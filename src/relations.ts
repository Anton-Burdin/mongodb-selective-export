import { Logger } from "pino";

export type RelationType =
  | "oneToMany"
  | "manyToMany"
  | "manyToOne"
  | "oneToOne";

export interface IRelation {
  to: string;
  field?: string;
  toField?: string;
  limit?: number;
  type?: RelationType; // only for
}

const addRel = (
  relations: Map<string, IRelation[]>,
  collection: string,
  rel: IRelation,
  logger: Logger
) => {
  if (!relations.has(collection)) {
    relations.set(collection, [rel]);
  } else {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const collectionRelations = relations.get(collection)!;
    // is not already exist
    const result = collectionRelations.find(
      (r) => r.to === rel.to && r.field === rel.field
    );
    if (!result) {
      collectionRelations.push(rel);
    } else if (result.toField !== rel.toField) {
      collectionRelations.push(rel);
      logger.warn(
        `Two similar relation ${collection}.${String(result.field)}-${
          result.to
        }[${String(result.toField)}|${String(rel.toField)}]`
      );
    }
  }
};

const reversType = (type?: RelationType): RelationType | undefined => {
  switch (type) {
    case "oneToMany":
      return "manyToOne";
    case "manyToOne":
      return "oneToMany";
    default:
      return type;
  }
};

export const formReversRelationSchema = (
  data: Record<string, IRelation[]>,
  logger: Logger
) => {
  const relations = new Map<string, IRelation[]>();

  Object.keys(data).forEach((collection: string) => {
    const collectionRelations = data[collection];

    collectionRelations.forEach((rel) => {
      const directCollection = collection;
      const directRel: IRelation = {
        to: rel.to,
        field: rel.field ?? "_id",
        toField: rel.toField ?? "_id",
        type: rel.type,
        limit: rel.limit,
      };

      const reversCollection = directRel.to;
      const reversRel: IRelation = {
        to: directCollection,
        field: directRel.toField,
        toField: directRel.field,
        type: reversType(rel.type),
      };

      addRel(relations, directCollection, directRel, logger);
      addRel(relations, reversCollection, reversRel, logger);
    });
  });

  return relations;
};

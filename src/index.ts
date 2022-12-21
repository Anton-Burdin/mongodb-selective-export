import { pino } from "pino";
import pretty from "pino-pretty";
import { extractRelationsFromDoc, IDocRelation } from "./doc-extractor";
import {
  creteFolder,
  loadExportedDocuments,
  saveQueries,
  loadSRelationSchema,
} from "./file-manager";
import {
  exportDocumentsFromCollection,
  formExportQueriesFromCollectionRelations,
  IDoc,
  IExportQuery,
  ObjectId,
} from "./mongo-export";
import { formReversRelationSchema } from "./relations";

const collectionDocToSignature = (collection: string, doc: IDoc) =>
  `${collection}.${ObjectId.toString(doc._id)}`;

export const runExport = async (
  entryPoint: IExportQuery,
  mongoUri: string,
  exportFolder: string,
  ymlFile: string
) => {
  const logger = pino(pretty({ hideObject: true }));

  const queriesInProgress: IExportQuery[] = [entryPoint];
  const loadedDocuments = new Set<string>(); // collection._id

  // read yaml
  const relationsData = await loadSRelationSchema(ymlFile, logger);
  const relationSchema = formReversRelationSchema(relationsData, logger);

  const collectionsFolder = `${exportFolder}/collections`;
  const isCreatedCollectionsFolder = await creteFolder(collectionsFolder);
  if (!isCreatedCollectionsFolder) {
    await loadExportedDocuments(
      collectionsFolder,
      (collection, document) => {
        loadedDocuments.add(collectionDocToSignature(collection, document));
      },
      logger
    );
  }

  while (queriesInProgress.length) {
    const { query, collection } = queriesInProgress.pop()!;
    const collectionRelations: IDocRelation[] = [];

    await exportDocumentsFromCollection(
      {
        collection,
        query,
        mongoUri,
        exportFolder: collectionsFolder,
      },
      loadedDocuments,
      (document) => {
        loadedDocuments.add(collectionDocToSignature(collection, document));

        extractRelationsFromDoc(
          document,
          collection,
          relationSchema,
          logger
        ).forEach((relation) => {
          // skip already loaded documents
          if (
            !(
              relation.path === "_id" &&
              loadedDocuments.has(
                `${relation.collection}.${String(relation.value)}`
              )
            )
          ) {
            collectionRelations.push(relation);
          }
        });
      },
      logger
    );

    if (collectionRelations.length) {
      formExportQueriesFromCollectionRelations(collectionRelations).forEach(
        (query) => {
          queriesInProgress.push(query);
        }
      );
    }

    await saveQueries(exportFolder, queriesInProgress, logger);
  }
};

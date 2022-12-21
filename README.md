# Mongodb selective export

Export only required documents from the Mongodb.

## Prerequisites

1. Install [mongoexport](https://www.mongodb.com/docs/v4.2/reference/program/mongoexport/#bin.mongoexport) tool
2. Yaml schema of your db relations 

## Getting started

1. `npx mongodb-selective-export export --relations=[path] --entirypoints=[contiditonal]`

Available commands:

- `export`: export documents from db

## Roadmap

1. Test coverage
2. Array in array oid
3. Dynamic relation
4. Parallel export
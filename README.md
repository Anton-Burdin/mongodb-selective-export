# Mongodb selective export

Export only required documents from the Mongodb.

## Prerequisites

1. Install [mongoexport](https://www.mongodb.com/docs/v4.2/reference/program/mongoexport/#bin.mongoexport) tool
2. Yaml schema of your db relations 

## Getting started

1. `npx mongodb-selective-export export [options] <JSONentryPoints>`
#### Example:
```
$ npx mongodb-selective-export export --relations=./relations.yaml --uri="mongodb://localhost:27017/test" '{"collection":"User","query":{"_id":{"$in":[{"$oid":"5a85a984dd5e16cf4ddad6b3"}]}}}'
```

```yaml
# relations.yaml
User:
  - to: Order
    field: _id # optional, by default _id
    toField: user
Order:
  - to: Product
    field: product
    toField: _id # optional, by default _id
  - to: User # optional, will automatically generate an inverse relation
    field: user
    toField: _id    
Product: []
```

Available commands:

- `export`: export documents from db

## Road map

1. Test coverage
2. Array in array oid
3. Dynamic relation
4. Parallel export
# Joystream Query Node

This is an experimental work. Query Joystream blockchain data with through GraphQL API.

## Use type defination in schema.json to generate model/resolver/servis

```bash
yarn cli generate
```

## Run Grapql server

Install requirements

```bash
yarn install
```

Before running server make sure you add your postgresql username, password to .env file. In .env file there is database name so make sure you create the database.

```bash
yarn start:dev
```

Now Go to http://127.0.0.1:4100/graphql

## Updating GraphQL schema

```bash
yarn warthog codegen
```

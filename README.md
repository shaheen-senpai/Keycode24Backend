# projetcName-service

## Description

To build and maintain APIs for projetcName

## Installation


Prerequisites with preferred versions:

* node.js ~ >= 20.10.0
* npm ~ >= 10.2.3

```bash
$ npm install
```

## Running the app

```bash
Create .env file and copy data from env.sample and enter all the values
Create docker.env and copy data from docker.env.sample and enter all the values
After running the `docker-compose up` command, create a database if not exist. Update the database name and credentials to the env and execute the further steps.

# development
Run following commands
$ docker-compose up
$ npm run run-migrations
$ npm run start:debug

Run following command to generate migration
$ npm run generate-migration --name=migrationFileName

# production
$ npm run start:server
```

## Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

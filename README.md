# VisFlow - Web-Based Dataflow Framework for Visual Data Exploration

[![Build Status](https://travis-ci.org/yubowenok/visflow.svg?branch=master)](https://travis-ci.org/yubowenok/visflow)

This is the installation guide for building and deploying new VisFlow instance.
For VisFlow usage, please see the [documentation](https://visflow.org/docs).

VisFlow uses [yarn](https://yarnpkg.com/en/) to build.
Run ``yarn install`` first to install all node dependencies.

## Development Web Client and Server

The VisFlow system has three essential components:
- web client
- server
- mongoDB

Make sure ``mongod`` is running in the environment where VisFlow is running.
See [mongoDB](https://docs.mongodb.com/manual/installation/) to set up mongoDB.

The web client and server need to be built before deployment.

## Env configuration
Before building production or running the development system, configure the execution environment in two ``.env`` files.

``client/.env``:
```
BASE_URL=/
TIME_ZONE=America/New_York
```

``server/.env``:
```
DATA_PATH=/data/visflow
MONGODB_URI=mongodb://localhost:27017/visflow
ALLOW_ORIGIN=http://localhost:8080;http://localhost:3000;https://visflow.org
SESSION_SECRET=123456
PORT=3000
```
``DATA_PATH`` must be a directory writable by nodejs.

## Development Web Client and Server
To run the web client and server in development:
```bash
yarn --cwd client start
yarn --cwd server start
```

By default, the dev client runs at port ``8080`` and the dev server runs at port ``3000``.
In ``server/.env``, the port of the client must be an allowed origin for the dev server to respond to dev client requests.

## Production Web Client and Server

To build the production client and server:

```bash
yarn --cwd client build
yarn --cwd server build
```

The distribution files for the client are located at ``client/dist``.
The distribution files for the server are located at ``server/dist``.

### Documentation

To build the documentation:
```bash
yarn --cwd docs build
```

The distribution files for the documentation are located at ``docs/dist``.

### FlowSense Setup

Setting up FlowSense is currently not supported.

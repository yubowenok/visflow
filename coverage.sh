mkdir -p coverage
cp client/coverage/coverage-final.json coverage/coverage-client.json
cp server/coverage/coverage-final.json coverage/coverage-server.json
yarn run nyc merge coverage coverage/coverage-final.json
nyc report -r lcov -r text --temp-directory=coverage

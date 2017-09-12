#!/bin/bash

if [ ! -e ta3ta2_api ]; then
  # clone ta3ta2-api and rename it to remove dash
  git clone https://gitlab.datadrivendiscovery.org/uncharted/ta3ta2-api.git
  mv ta3ta2-api ta3ta2_api
fi

./update-api-proto.sh

echo "Starting server ..."

# this might need to be in the background
python TA3.py

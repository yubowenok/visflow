#!/bin/bash

# if not exists ta3ta2_api
# then

if [ ! -e ta3ta2_api ]; then

git clone https://gitlab.datadrivendiscovery.org/uncharted/ta3ta2-api.git

mv ta3ta2-api ta3ta2_api

cd ta3ta2_api

touch __init__.py

python -m grpc_tools.protoc -I. --python_out=. --grpc_python_out=. core.proto

python -m grpc_tools.protoc -I. --python_out=. --grpc_python_out=. dataflow_ext.proto

python -m grpc_tools.protoc -I. --python_out=. --grpc_python_out=. data_ext.proto

cd ..

fi 

echo "Starting server ..."

# this might need to be in the background
python TA3.py

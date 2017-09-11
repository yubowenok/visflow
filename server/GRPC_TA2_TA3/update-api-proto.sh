#!/bin/bash

cd ta3ta2_api
# make it a module
touch __init__.py

python -m grpc_tools.protoc -I. --python_out=. --grpc_python_out=. core.proto
python -m grpc_tools.protoc -I. --python_out=. --grpc_python_out=. dataflow_ext.proto
python -m grpc_tools.protoc -I. --python_out=. --grpc_python_out=. data_ext.proto

cd ..


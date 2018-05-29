#!/bin/bash

base_regex="^base_path = .*"
data_regex="^data_path = .*"
diagram_regex="^diagram_path = .*"
base_path=""
data_path=""
diagram_path=""

while read line
do
if [[ $line =~ $base_regex ]]
then
  base_path=`echo $line | sed 's/base_path = //'`
elif [[ $line =~ $data_regex ]]
then
  data_path=`echo $line | sed 's/data_path = //'`
elif [[ $line =~ $diagram_regex ]]
then
  diagram_path=`echo $line | sed 's/diagram_path = //'`
fi
done < "config"

sample_data=$base_path$data_path'visflow/'
demo_data=$base_path$data_path'demo/'
demo_diagram=$base_path$diagram_path'demo/'

if [ ! -d "$base_path$data_path" ]
then
  mkdir -m 755 "$base_path$data_path"
fi
if [ ! -d "$demo_data" ]
then
  mkdir -m 755 "$demo_data"
fi
if [ ! -d "$sample_data" ]
then
  mkdir -m 755 "$sample_data"
fi

if [ ! -d "$base_path$diagram_path" ]
then
  mkdir -m 755 "$base_path$diagram_path"
fi
if [ ! -d "$demo_diagram" ]
then
  mkdir -m 755 "$demo_diagram"
fi

curl -L -o demo.zip https://www.dropbox.com/s/w2cpq1xgh18sk2o/visflow-demo-data.zip?dl=0
unzip demo.zip -d demo

cp -R demo/data/* "$demo_data"
cp -R demo/diagrams/* "$demo_diagram"
cp "$demo_data/car.csv" "$sample_data/car.csv"

base_regex="base_path = *"
data_regex="data_path = *"
diagram_regex="diagram_path = *"
base_path=""
data_path=""
diagram_path=""

while read line
do
if [[ $line =~ $base_regex ]]
then
  base_path=`echo $line | sed 's/$base_path = //' | sed 's/['\'';]//g'`
elif [[ $line =~ $data_regex ]]
then
  data_path=`echo $line | sed 's/$data_path = //' | sed 's/['\'';]//g'`
elif [[ $line =~ $diagram_regex ]]
then
  diagram_path=`echo $line | sed 's/$diagram_path = //' | sed 's/['\'';]//g'`
fi
done < "config.php"

if [ ! -d "$base_path$data_path" ]
then
  mkdir -m 755 "$base_path$data_path"
fi
if [ ! -d "$base_path$data_pathdemo" ]
then
  mkdir -m 755 "$base_path$data_pathdemo"
fi

if [ ! -d "$base_path$diagram_path" ]
then
  mkdir -m 755 "$base_path$diagram_path"
fi
if [ ! -d "$base_path$diagram_pathdemo" ]
then
  mkdir -m 755 "$base_path$diagram_pathdemo"
fi

curl -L -o demo.zip https://www.dropbox.com/s/44hxoxpe6mtufhy/visflow-demo-data.zip?dl=0
unzip demo.zip -d demo

cp -R demo/data/* "$base_path$data_pathdemo"
cp -R demo/diagrams/* "$base_path$diagram_pathdemo"

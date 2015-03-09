<?php

header('Content-type: application/json');

$filelist = glob("save/*.json");


for($i = 0; $i < count($filelist); $i++) {
  $filelist[$i] = substr($filelist[$i], 5, strlen($filelist[$i]) - 10); // remove "save/" and ".json"
}

$response = array();
$response['filelist'] = $filelist;

echo json_encode($response);

?>
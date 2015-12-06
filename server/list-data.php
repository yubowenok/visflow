<?php
header('Content-type: application/json');

function abort($msg='') {
  $response['msg'] = $msg;
  echo json_encode($response);
  exit();
}
$filelist = glob('data/*');

$result = array();
for($i = 0; $i < count($filelist); $i++) {

  $fileName = substr($filelist[$i], 5, strlen($filelist[$i])); // remove "data/" prefix
  $dataName = file_get_contents('data-names/' . $fileName . '.name');

  array_push($result, array(
    'dataname' => $dataName,
    'filename' => $fileName,
    'mtime' => filemtime($filelist[$i]) * 1000,
    'isDir' => is_dir($filelist[$i])
  ));
}
$response = array();
$response['filelist'] = $result;

$response['success'] = true;
echo json_encode($response);
?>

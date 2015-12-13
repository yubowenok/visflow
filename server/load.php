<?php
header('Content-type: application/json');

function abort($msg='') {
  $response['status'] = 'error';
  $response['msg'] = $msg;
  echo json_encode($response);
  exit();
}

if (!isset($_POST['type']))
  abort('POST type not set for load.php');

if ($_POST['type'] == 'filelist') {
  $filelist = glob('diagrams/*.json');

  $result = array();
  for($i = 0; $i < count($filelist); $i++) {

    // remove "diagrams/" prefix and ".json" suffix
    $filename = substr($filelist[$i], 9, strlen($filelist[$i]) - 14);

    array_push($result, array(
      'filename' => $filename,
      'mtime' => filemtime($filelist[$i]) * 1000
    ));
  }
  $response = array();
  $response['filelist'] = $result;

} elseif ($_POST['type'] == 'download') {
  $filepath = 'diagrams/'.$_POST['filename'].'.json';
  if (!is_readable($filepath))
    abort('file does not exist or is not readable');

  $diagram = json_decode(file_get_contents($filepath));
  $response['diagram'] = $diagram;
}
$response['status'] = 'success';
echo json_encode($response);

?>
<?php

header('Content-type: application/json');

$paraok = 1;
if (!isset($_POST['filename']) || !isset($_POST['dataflow'])){
  $response['status'] = 'error';
  $response['msg'] = 'Filename or dataflow not set.';
  $paraok = 0;
}

if (!file_exists('save')) {
    mkdir('save', 0777, true);
}

if ($paraok) {
  $filename = $_POST['filename'];
  $dataflow = $_POST['dataflow'];

  if (json_decode($dataflow) != null) {
    $file = fopen('save/'.$filename.'.json','w');
    $ok = fwrite($file, $dataflow);
    fclose($file);
    if ($ok == false) {
      $response['status'] = 'error';
      $response['msg'] = 'Cannot write to file: no write permission.';
    } else {
      $response['filename'] = $filename;
      $response['status'] = 'success';
    }
  } else {
    $response['status'] = 'error';
    $response['msg'] = 'Dataflow cannot be decoded.';
  }
}

echo json_encode($response);

?>
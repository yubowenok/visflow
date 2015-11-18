<?php

header('Content-type: application/json');

$paraok = 1;
if (!isset($_POST['filename']) || !isset($_POST['flow'])){
  $response['status'] = 'error';
  $response['msg'] = 'Filename or flow not set.';
  $paraok = 0;
}

if (!file_exists('save')) {
    mkdir('save', 0777, true);
}

if ($paraok) {
  $filename = $_POST['filename'];
  $flow = $_POST['flow'];

  if (json_decode($flow) != null) {
    $file = fopen('save/'.$filename.'.json','w');
    $ok = fwrite($file, $flow);
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
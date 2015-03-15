<?php

header('Content-type: application/json');

$paraok = 1;
if (!isset($_POST['filename']) || !isset($_POST['dataflow'])){
  $response['status'] = 'error';
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
    fwrite($file, $dataflow);
    fclose($file);
    $response['filename'] = $filename;
    $response['status'] = 'success';
  } else {
    $response['status'] = 'error';
  }
}

echo json_encode($response);

?>
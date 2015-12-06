<?php
header('Content-type: application/json');

function abort($msg='') {
  $response['msg'] = $msg;
  echo json_encode($response);
  exit();
}

if (!isset($_POST['name']))
  abort('data name not set');
if (!isset($_POST['file']))
  abort('file name not set');
if (!isset($_POST['data']))
  abort('data content not set');

$filename = $_POST['file'];

$saved_file = 'data/' . $filename;
$name_file = 'data-names/' . $filename .'.name';

$name_written = file_put_contents($name_file, $_POST['name']);
if (!$name_written)
  abort('failed to write name file');
$data_written = file_put_contents($saved_file, $_POST['data']);
if (!$data_written)
  abort('failed to write data content');
  
$response['success'] = true;
echo json_encode($response);
?>

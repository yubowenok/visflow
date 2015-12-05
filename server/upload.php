<?php
header('Content-type: application/json');

function abort($msg='') {
  $response['msg'] = $msg;
  echo json_encode($response);
  exit();
}

if (!isset($_POST['name']))
  abort('data name not set');
if (!isset($_FILES['file']))
  abort('file not set');
if ($_FILES['file']['size'] > 500000)
  abort('file size should be < 500,000');

if (!file_exists('data'))
  mkdir('data', 0777, true);
if (!file_exists('data-names'))
  mkdir('data-names', 0777, true);

$filename = $_FILES['file']['name'];

$saved_file = 'data/' . basename($filename);
$name_file = 'data-names/' . $filename . '.name';

$name_written = file_put_contents($name_file, $_POST['name']);
if (!$name_written)
  abort('failed to write name file');

if (move_uploaded_file($_FILES['file']['tmp_name'], $saved_file)) {
  $response['success'] = true;
  chmod($saved_file, 0777);
} else {
  abort('failed to save file');
}
echo json_encode($response);
?>
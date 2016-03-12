<?php

include 'file.php';

checkLogin();

if (!isset($_POST['name']))
  abort('data name not set');
if (!isset($_FILES['file']))
  abort('file not set');
if ($_FILES['file']['size'] > 20 * 1024 * 1024)
  abort('file size should be no larger than 20M');

$data_name = $_POST['name'];
$file_name = basename($_FILES['file']['name']);
$tmp_file = $_FILES['file']['tmp_name'];

$error = saveUploadedData($file_name, $data_name, $tmp_file);
if ($error != '')
  abort($error);

status(200);

?>

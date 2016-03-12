<?php

include 'file.php';

checkLogin();

if (!isset($_POST['name']))
  abort('data name not set');
if (!isset($_POST['file']))
  abort('file name not set');
if (!isset($_POST['data']))
  abort('data content not set');

$file_name = $_POST['file'];
$data_name = $_POST['name'];
$data = $_POST['data'];

$error = savePostedData($file_name, $data_name, $data);
if ($error != '')
  abort($error);

status(200);

?>

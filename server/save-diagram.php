<?php

include 'file.php';

checkLogin();

if (!isset($_POST['filename']))
  abort('filename not set');
if (!isset($_POST['flow']))
  abort('flow not set');

$filename = $_POST['filename'];
$flow = $_POST['flow'];

if (json_decode($flow) != null)
  saveDiagram($filename, $flow);
else
  abort('flow diagram cannot be decoded');

status(200);

?>

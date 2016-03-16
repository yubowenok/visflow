<?php

include 'file.php';

checkLogin();

if (!isset($_GET['fileName']))
  abort('fileName not set');

$data = getData($_GET['fileName']);
contentType('text');
echo $data;

?>

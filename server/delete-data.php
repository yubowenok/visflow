<?php

include 'file.php';

checkLogin();

if (!isset($_POST['fileName']))
  abort('fileName not set');

deleteData($_POST['fileName']);

status(200);

?>

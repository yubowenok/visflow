<?php

include 'file.php';

checkLogin();

if (!isset($_POST['id']))
  abort('data id not set');

$dataId = $_POST['id'];
$row = getOneDB("SELECT user_id FROM data WHERE id=%d",
               array($dataId));
if (!$row)
  abort('dataset to be deleted does not exit');
if ($row['user_id'] != $user_id)
  abort('you cannot delete a shared dataset');

deleteData($dataId);

status(200);

?>

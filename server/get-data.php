<?php

include 'file.php';

checkLogin();

if (!isset($_GET['id']))
  abort('data id not set');

$data_id = $_GET['id'];

$row = getOneDB("SELECT user_id FROM data WHERE id=%d",
               array($data_id));
if (!$row)
  abort('data to get does not exist');
if ($row['user_id'] != $user_id)
{
  // other's data
  if (!countDB("SELECT * FROM share_data WHERE data_id=%d AND user_id=%d",
              array($data_id, $user_id)))
    abort('requested data is not shared with you');
}

$data = getData($_GET['id']);
contentType('text');
echo $data;

?>

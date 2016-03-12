<?php

include 'file.php';

checkLogin();

$result = queryDB("SELECT name, UNIX_TIMESTAMP(update_time) AS update_time FROM diagram WHERE user_id=%d",
                 array($user_id));

$diagram_list = array();
while ($row = mysql_fetch_assoc($result))
{
  $diagram_name = $row['name'];
  $update_time = $row['update_time'];
  array_push($diagram_list, array(
    'filename' => $diagram_name,
    'mtime' => $update_time * 1000,
  ));
}

$response = array();
$response['filelist'] = $diagram_list;
contentType('json');
echo json_encode($response);

?>

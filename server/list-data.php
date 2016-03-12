<?php

include 'session.php';
include 'config.php';

$result = queryDB("SELECT name, file_name, UNIX_TIMESTAMP(upload_time) as upload_time, size FROM data WHERE user_id=%d",
                 array($user_id));

$data_list = array();
while ($row = mysql_fetch_assoc($result))
{
  array_push($data_list, array(
    'dataname' => $row['name'],
    'filename' => $row['file_name'],
    'mtime' => $row['upload_time'] * 1000,
    'size' => $row['size'],
    //'isDir' => is_dir($filelist[$i]),
  ));
}

contentType('json');
$response = array();
$response['filelist'] = $data_list;
echo json_encode($response);

?>

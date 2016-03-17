<?php

include 'file.php';

$result = queryDB("SELECT id, name, file_name, UNIX_TIMESTAMP(upload_time) as upload_time, size FROM data WHERE user_id=%d",
                 array($user_id));

$data_list = array();
while ($row = mysql_fetch_assoc($result))
{
  array_push($data_list, array(
    'id' => $row['id'],
    'name' => $row['name'],
    'file' => $row['file_name'],
    'mtime' => $row['upload_time'] * 1000,
    'size' => $row['size'],
    'shareWith' => getDataShareWith($row['id']),
    'owner' => '',
  ));
}

$result = queryDB("SELECT username, user_id, data_id, name, file_name, UNIX_TIMESTAMP(upload_time) AS upload_time, size FROM "
                ."(((SELECT data_id FROM share_data WHERE user_id=%d) AS T LEFT JOIN data ON T.data_id=data.id) "
                ."LEFT JOIN user ON user_id=user.id)",
               array($user_id));
while ($row = mysql_fetch_assoc($result))
{
  if ($row['user_id'] == $user_id)
    // incorrect share_data entry, ignore
    continue;
  array_push($data_list, array(
    'id' => $row['data_id'],
    'name' => $row['name'],
    'file' => $row['file_name'],
    'mtime' => $row['upload_time'] * 1000,
    'size' => $row['size'],
    'shareWith' => getDataShareWith($row['data_id']),
    'owner' => $row['username'],
  ));
}

contentType('json');
echo json_encode($data_list);

?>

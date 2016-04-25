<?php

include 'file.php';

function pushDataList(&$dataList, $row)
{
  array_push($dataList, array(
    'id' => $row['data_id'],
    'name' => $row['name'],
    'file' => $row['file_name'],
    'mtime' => $row['upload_time'] * 1000,
    'size' => $row['size'],
    'shareWith' => getDataShareWith($row['data_id']),
    'owner' => $row['username'],
  ));
}

$result = queryDB("SELECT id AS data_id, name, file_name, UNIX_TIMESTAMP(upload_time) as upload_time, size FROM data WHERE user_id=%d",
                  array($user_id));

$dataList = array();
while ($row = $result->fetch_assoc())
{
  $row['username'] = '';
  pushDataList($dataList, $row);
}

$result = queryDB("SELECT username, user_id, data_id, name, file_name, UNIX_TIMESTAMP(upload_time) AS upload_time, size FROM "
                 ."(((SELECT DISTINCT(Q.data_id) FROM (SELECT data_id FROM share_data WHERE user_id=%d UNION ALL SELECT data_ID FROM sample_data) AS Q) "
                 ."AS T LEFT JOIN data ON T.data_id=data.id) LEFT JOIN user ON user_id=user.id)",
                 array($user_id));
while ($row = $result->fetch_assoc())
{
  if ($row['user_id'] == $user_id)
    // incorrect share_data entry, ignore
    continue;
  pushDataList($dataList, $row);
}

contentType('json');
echo json_encode($dataList);

?>

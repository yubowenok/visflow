<?php

include 'file.php';

checkLogin();

$result = queryDB("SELECT id, name, UNIX_TIMESTAMP(update_time) AS update_time FROM diagram WHERE user_id=%d",
                 array($user_id));

$diagram_list = array();
while ($row = mysql_fetch_assoc($result))
{
  array_push($diagram_list, array(
    'id' => $row['id'],
    'name' => $row['name'],
    'mtime' => $row['update_time'] * 1000,
    'owner' => '',
    'shareWith' => getDiagramShareWith($row['id'])
  ));
}

$result = queryDB("SELECT username, diagram_id, name, UNIX_TIMESTAMP(update_time) AS update_time FROM "
                  ."(((SELECT diagram_id FROM share_diagram WHERE user_id=%d) AS T LEFT JOIN diagram ON T.diagram_id=diagram.id) "
                  ."LEFT JOIN user ON user_id=user.id)",
                 array($user_id));
while ($row = mysql_fetch_assoc($result))
{
  array_push($diagram_list, array(
    'id' => $row['diagram_id'],
    'name' => $row['name'],
    'mtime' => $row['update_time'] * 1000,
    'owner' => $row['username'],
    'shareWith' => getDiagramShareWith($row['diagram_id']),
  ));
}

contentType('json');
echo json_encode($diagram_list);

?>

<?php

include 'file.php';

checkLogin();

if (!isset($_POST['fileName']))
  abort('fileName not set');

$row = getOneDB("SELECT id FROM data WHERE user_id=%d AND file_name='%s'",
        array($user_id, $_POST['fileName']));
if (!$row)
  abort('data fileName requested does not exist');

status(200);
contentType('text');
echo $row['id'];

?>

<?php

include 'mysql.php';

function fail() {
  $result = queryDB("DELETE FROM auth WHERE session_id='%s'",
                  array(session_id()));
  status(500);
  $session_destroy();
  exit();
}

session_start([
  'cookie_lifetime' => 3600, // cookie time 1 hour
]);

$session_id = session_id();

connectDB();

$result = queryDB("SELECT user_id, UNIX_TIMESTAMP(end_time) as end_time FROM auth WHERE session_id='%s'",
                  array($session_id));
if (!mysql_num_rows($result))
  fail();

$row = mysql_fetch_assoc($result);

$cur_time = date_timestamp_get(date_create());
$end_time = $row['end_time'];

if ($cur_time > $end_time)
  fail();

$user_id = $row['user_id'];
$username = getOneDB("SELECT username FROM user WHERE id=%d",
                 array($user_id))['username'];

status(200);
contentType('text');
echo $username;

?>

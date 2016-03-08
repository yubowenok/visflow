<?php

include 'mysql.php';

connectDB();

session_start([
  'cookie_lifetime' => 3600, // cookie time 1 hour
  'cookie_secure' => true,
]);

$session_id = session_id();
$username = '';

$row = getOneDB("SELECT id, user_id, UNIX_TIMESTAMP(end_time) as end_time FROM auth WHERE session_id='%s'",
                  array($session_id));
if (!$row || $row['end_time'] < time())
{
  // Delete out-of-date record
  $result = queryDB("DELETE FROM auth WHERE session_id='%s'",
                 array(session_id()));
  session_destroy();
}
else
{
  $auth_id = $row['id'];
  $user_id = $row['user_id'];
  $username = getOneDB("SELECT username FROM user WHERE id=%d",
                 array($user_id))['username'];

  // extend the expiration time
  $new_end_time = time() + 3600;
  queryDB("UPDATE auth SET end_time=FROM_UNIXTIME(%d) WHERE id=%d",
                 array($new_end_time, $auth_id));
}

?>

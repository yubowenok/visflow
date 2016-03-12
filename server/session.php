<?php

include 'mysql.php';

function checkLogin()
{
  global $user_id, $username;
  if ($user_id == -1 || $username == '')
    abort('login required');
}

connectDB();

session_start([
  'cookie_lifetime' => 3600, // cookie time 1 hour
  'cookie_secure' => true,
]);

$session_id = session_id();
$username = '';
$user_id = -1;
$auth_id = -1;

$row = getOneDB("SELECT id AS auth_id, user_id, UNIX_TIMESTAMP(end_time) as end_time FROM auth WHERE session_id='%s'",
                  array($session_id));
if (!$row || $row['end_time'] < time())
{
  // Delete out-of-date record
  $result = queryDB("DELETE FROM auth WHERE session_id='%s'",
                 array(session_id()));
}
else
{
  $auth_id = $row['auth_id'];
  $user_id = $row['user_id'];
  $username = getOneDB("SELECT username FROM user WHERE id=%d",
                 array($user_id))['username'];

  // extend the expiration time
  $new_end_time = time() + 3600;
  queryDB("UPDATE auth SET end_time=FROM_UNIXTIME(%d) WHERE id=%d",
                 array($new_end_time, $auth_id));
}

?>

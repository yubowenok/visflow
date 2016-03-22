<?php

include 'session.php';

if (!isset($_POST['username']))
  abort('username not set');

if (!isset($_POST['password']))
  abort('password not set');

$username = $_POST['username'];
$password = hash('sha256', $_POST['password']);

$row = getOneDB("SELECT id FROM user WHERE username='%s' and password='%s'",
               array($username, $password));
if (!$row)
{
  status(401);
  contentType('text');
  echo 'username or password incorrect';
  exit();
}

$cur_time = time();
$end_time = $cur_time + 3600;
$user_id = $row['id'];

if (countDB("SELECT * FROM auth WHERE session_id='%s'",
           array($session_id)))
{
  queryDB("UPDATE auth SET end_time=FROM_UNIXTIME(%d) WHERE user_id=%d AND session_id='%s'",
        array($end_time, $user_id, $session_id));
}
else
{
queryDB("INSERT INTO auth (user_id, session_id, end_time) VALUES (%d, '%s', FROM_UNIXTIME(%d))",
        array($user_id, $session_id, $end_time));
}

status(200);
contentType('text');
echo $username;

?>

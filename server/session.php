<?php

include 'mysql.php';

const SESSION_LIFETIME = 3600;

function checkLogin()
{
  global $user_id, $username;
  if ($user_id == -1 || $username == '')
    abort('login required');
}

function clientIP()
{
  $ip_address = '';
  if (getenv('HTTP_CLIENT_IP'))
    $ip_address = getenv('HTTP_CLIENT_IP');
  else if(getenv('HTTP_X_FORWARDED_FOR'))
    $ip_address = getenv('HTTP_X_FORWARDED_FOR');
  else if(getenv('HTTP_X_FORWARDED'))
    $ip_address = getenv('HTTP_X_FORWARDED');
  else if(getenv('HTTP_FORWARDED_FOR'))
    $ip_address = getenv('HTTP_FORWARDED_FOR');
  else if(getenv('HTTP_FORWARDED'))
    $ip_address = getenv('HTTP_FORWARDED');
  else if(getenv('REMOTE_ADDR'))
    $ip_address = getenv('REMOTE_ADDR');
  else
    $ip_address = 'unknown';
  return $ip_address;
}

if($_SERVER['SERVER_PORT'] != 443)
{
  // redirect to https
  status(301);
  header('Location: https://'.$_SERVER['HTTP_HOST'].$_SERVER['REQUEST_URI']);
  exit();
}

connectDB();

session_start([
  'cookie_lifetime' => SESSION_LIFETIME, // cookie duration 1 hour
  'cookie_secure' => true,
]);

$session_id = session_id();
$username = '';
$user_id = -1;
$user_ip = clientIP();
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
  $new_end_time = time() + SESSION_LIFETIME;
  queryDB("UPDATE auth SET end_time=FROM_UNIXTIME(%d) WHERE id=%d",
                 array($new_end_time, $auth_id));
}

queryDB("INSERT INTO visit (user_id, ip, session_id, url) VALUES (%d, '%s', '%s', '%s')",
       array($user_id, $user_ip, $session_id, $_SERVER['REQUEST_URI']));

?>

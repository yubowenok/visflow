<?php

include 'mysql.php';

$min_username_length = 6;
$min_password_length = 8;

if($_SERVER['SERVER_PORT'] != 443)
{
  status(403);
  exit();
}

if (!isset($_POST['username']))
  abort('username not set');

if (!isset($_POST['password']))
  abort('password not set');

if (!isset($_POST['email']))
  abort('email not set');

$username = $_POST['username'];
$password = $_POST['password'];
$email = $_POST['email'];

if (strlen($username) < $min_username_length)
  abort('username too short');

if (strlen($password) < $min_password_length)
  abort('password too short');

if (!preg_match('/[0-9a-z_]+/', $username))
  abort('invalid username');
if (!filter_var($email, FILTER_VALIDATE_EMAIL))
  abort('invalid email address');

$password = hash('sha256', $password);

$db = connectDB();

// check for existing username
if (countDB("SELECT * FROM user WHERE username='%s'",
            array($username)))
  abort('username exists');

// check for existing email
if (countDB("SELECT * FROM user WHERE email='%s'",
            array($email)))
  abort('email exists');

// create user
queryDB("INSERT INTO user (username, password, email) VALUES ('%s', '%s', '%s')",
            array($username, $password, $email));

session_start([
  'cookie_lifetime' => 3600, // cookie time 1 hour
]);
$session_id = session_id();

$result = queryDB("SELECT id FROM user WHERE username='%s'",
            array($username));
$user_id = mysql_fetch_assoc($result)['id'];

// add auth session
$end_time = date_timestamp_get(date_create()) + 3600; // +1 hour
queryDB("INSERT INTO auth (user_id, session_id, end_time) VALUES (%d, '%s', FROM_UNIXTIME(%d))",
       array($user_id, $session_id, $end_time));

status(200);
contentType('text');
echo $end_time;

?>

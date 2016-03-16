<?php

include 'session.php';
include 'config.php';

checkLogin();

if (!isset($_POST['oldPassword']))
  abort('old password not set');
if (!isset($_POST['password']))
  abort('new password not set');
if (!isset($_POST['email']))
  abort('email not set');

$row = getOneDB("SELECT password FROM user WHERE id=%d",
               array($user_id));
if (!$row)
  abort('user does not exist');

$oldPassword = hash('sha256', $_POST['oldPassword']);
if ($oldPassword != $row['password'])
  abort('old password incorrect');

if ($_POST['password'] !== '')
{
  if (strlen($_POST['password']) < $min_password_length)
    abort('new password too short');
  $password = hash('sha256', $_POST['password']);
  queryDB("UPDATE user SET password='%s' WHERE id=%d",
         array($password, $user_id));
}
if ($_POST['email'] !== '')
{
  $email = $_POST['email'];
  if (!filter_var($email, FILTER_VALIDATE_EMAIL))
    abort('invalid email address');
  queryDB("UPDATE user SET email='%s' WHERE id=%d",
         array($email, $user_id));
}

status(200);

?>

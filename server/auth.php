<?php

include 'session.php';

if ($username == '')
{
  status(401);
  contentType('text');
  echo 'authentication failed';
  exit();
}
else
{
  status(200);
  contentType('text');
  echo $username;
}

?>

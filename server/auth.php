<?php
/**
 * Authenticates the current session when the VisFlow page is opened.
 * The authentication can be called independently from the client.
 */
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

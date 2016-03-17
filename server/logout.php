<?php

include 'session.php';

function fail()
{
  status(401);
  contentType('text');
  echo 'already logged-out';
  session_destroy();
  exit();
}

connectDB();

$row = getOneDB("SELECT id, user_id, UNIX_TIMESTAMP(end_time) as end_time FROM auth WHERE session_id='%s'",
                  array($session_id));
if (!$row)
  fail();

queryDB("DELETE FROM auth WHERE session_id='%s'",
        array($session_id));
session_destroy();
status(200);

?>

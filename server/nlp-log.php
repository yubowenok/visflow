<?php

include 'session.php';
include 'common.php';

if (!isset($_POST['query']))
  abort('query not set');
if (!isset($_POST['result']))
  abort('result not set');

$query = $_POST['query'];
$result = $_POST['result'];

function logNLPQuery($query, $result)
{
  global $user_id;
  $user = $user_id;
  if ($user == -1)
    $user = 1; // use visflow for anonymous
  queryDB("INSERT INTO nlp (user_id, time, query, result) VALUES (%d, FROM_UNIXTIME(%d), '%s', '%s')",
          array($user, time(), $query, $result));
}

logNLPQuery($query, $result);

echo 'OK';

?>
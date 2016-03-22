<?php
include 'response.php';

function connectDB()
{
  $db = mysql_connect('localhost', 'visflow', 'visflow');
  if (!$db)
    exit('cannot connect to db: ' . mysql_error());

  $db_selected = mysql_select_db('visflow', $db);
  if (!$db_selected)
    exit('cannot use visflow db: ' . mysql_error());

  return $db;
}

function escStr($str)
{
  return mysql_real_escape_string($str);
}

function queryDB($query, $args)
{
  $query = vsprintf($query, $args);
  $result = mysql_query($query);
  if (!$result)
    abort('db query error: ' . mysql_error());
  return $result;
}

function getOneDB($query, $args)
{
  $result = queryDB($query, $args);
  if (!mysql_num_rows($result))
    return false;
  return mysql_fetch_assoc($result);
}

function countDB($query, $args)
{
  $result = queryDB($query, $args);
  return mysql_num_rows($result);
}

function closeDB($db)
{
  mysql_close($db);
}

?>

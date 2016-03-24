<?php
include 'response.php';

function connectDB()
{
  global $db;
  $db = new mysqli('localhost', 'visflow', 'visflow', 'visflow');
  if ($db->connect_errno)
    abort('cannot connect to db: ' . $db->connect_error);
}

function escStr($str)
{
  global $db;
  return $db->real_escape_string($str);
}

function queryDB($query, $args)
{
  global $db;
  $query = vsprintf($query, $args);
  $result = $db->query($query);
  if (!$result)
    abort('db query error: ' . $db->error);
  return $result;
}

function getOneDB($query, $args)
{
  $result = queryDB($query, $args);
  if (!$result->num_rows)
    return false;
  return $result->fetch_assoc();
}

function countDB($query, $args)
{
  $result = queryDB($query, $args);
  return $result->num_rows;
}

function closeDB()
{
  global $db;
  $db->close();
}

?>

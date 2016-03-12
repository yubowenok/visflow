<?php

// Provides data/diagram file writing/reading functions.

include 'session.php';
include 'config.php';

function checkDir($dir)
{
  global $base_path;
  if (!file_exists($base_path . $dir))
    mkdir($dir, 0700, true);
}

function updateDataDB($file_name, $data_name, $file_path, $file_size)
{
  global $user_id;
  if (countDB("SELECT * FROM data WHERE user_id=%d AND file_name='%s'",
             array($user_id, $file_name)))
    queryDB("UPDATE data SET name='%s', size=%d, upload_time=FROM_UNIXTIME(%d) WHERE user_id=%d AND file_name='%s'",
           array($data_name, $file_size, time(), $user_id, $file_name));
  else
    queryDB("INSERT INTO data (user_id, name, file_name, file_path, size) VALUES (%d, '%s', '%s', '%s', %d)",
            array($user_id, $data_name, $file_name, $file_path, $file_size));
}

function savePostedData($file_name, $data_name, $data)
{
  global $user_id, $username, $data_path, $base_path;
  checkLogin();

  $dir = $data_path . $username . '/';
  $file_path = $dir . $file_name;
  $full_path = $base_path . $file_path;
  checkDir($dir);

  if (!file_put_contents($full_path, $data))
    abort('unable to write posted data');

  $file_size = filesize($full_path);
  updateDataDB($file_name, $data_name, $file_path, $file_size);
}

function saveUploadedData($file_name, $data_name, $tmp_file)
{
  global $user_id, $username, $data_path, $base_path;
  checkLogin();

  $dir = $data_path . $username . '/';
  $file_path = $dir . $file_name;
  $full_path = $base_path . $file_path;
  checkDir($dir);

  if (!move_uploaded_file($tmp_file, $full_path))
    return 'failed to move uploaded file';

  $file_size = filesize($full_path);
  updateDataDB($file_name, $data_name, $file_path, $file_size);
}

function deleteData($file_name)
{
  global $user_id, $username, $data_path, $base_path;
  checkLogin();

  $row = getOneDB("SELECT id, file_path FROM data WHERE user_id=%d AND file_name='%s'",
                 array($user_id, $file_name));
  if (!$row)
    abort('data to be deleted does not exist');

  $data_id = $row['id'];
  $full_path = $base_path . $row['file_path'];
  if (!unlink($full_path))
    abort('cannot unlink data');
  queryDB("DELETE FROM data WHERE id=%d",
         array($data_id));
}

function updateDiagramDB($diagram_name, $file_path)
{
  global $user_id;
  if (countDB("SELECT name FROM diagram WHERE user_id=%d AND name='%s'",
             array($user_id, $diagram_name)))
    queryDB("UPDATE diagram SET update_time=FROM_UNIXTIME(%d) WHERE user_id=%d AND name='%s'",
           array(time(), $user_id, $diagram_name));
  else
    queryDB("INSERT INTO diagram (user_id, name, file_path) VALUES (%d, '%s', '%s')",
            array($user_id, $diagram_name, $file_path));
}

function saveDiagram($diagram_name, $diagram)
{
  global $user_id, $username, $diagram_path, $base_path;
  checkLogin();

  $dir = $diagram_path . $username . '/';
  $file_path = $dir . $diagram_name;
  $full_path = $base_path . $file_path;
  checkDir($dir);

  $file = fopen($full_path, 'w');
  if (!fwrite($file, $diagram))
    abort('cannot write to diagram file, no write permission');

  updateDiagramDB($diagram_name, $file_path);
}

function loadDiagram($diagram_name)
{
  global $user_id, $username, $diagram_path, $base_path;
  checkLogin();

  $row = getOneDB("SELECT file_path FROM diagram WHERE user_id=%d AND name='%s'",
                    array($user_id, $diagram_name));
  if (!$row)
    abort('diagram does not exist');

  $file_path = $row['file_path'];
  $full_path = $base_path . $file_path;
  if (!is_readable($full_path))
    abort('diagram file not readable');

  return json_decode(file_get_contents($full_path));
}

function deleteDiagram($diagram_name)
{
  global $user_id, $username, $diagram_path, $base_path;
  checkLogin();

  $row = getOneDB("SELECT id, file_path FROM diagram WHERE user_id=%d AND name='%s'",
                 array($user_id, $diagram_name));
  if (!$row)
    abort('diagram to be deleted does not exist');

  $diagram_id = $row['id'];
  $full_path = $base_path . $row['file_path'];
  if (!unlink($full_path))
    abort('cannot unlink diagram');
  queryDB("DELETE FROM diagram WHERE id=%d",
         array($diagram_id));
}

?>

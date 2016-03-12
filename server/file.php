<?php

// This file has data writing functions. This must be used
// by another php handler which includes session.php and config.php.

function checkDir($dir)
{
  if (!file_exists($dir))
    mkdir($dir, 0700, true);
}

function savePostedData($file_name, $data_name, $data)
{
  global $user_id, $username, $data_path;

  if ($user_id == -1 || $username == '')
    return 'login required';

  $dir = $data_path . $username . '/';
  $file_path = $dir . $file_name;
  checkDir($dir);

  if(!file_put_contents($file_path, $data))
    return 'unable to write posted data';

  $file_size = filesize($file_path);

  queryDB("INSERT INTO data (user_id, name, file_name, file_path, size) VALUES (%d, '%s', '%s', '%s', %d)",
          array($user_id, $data_name, $file_name, $file_path, $file_size));
}

function saveUploadedData($file_name, $data_name, $tmp_file)
{
  global $user_id, $username, $data_path;

  if ($user_id == -1 || $username == '')
    return 'login required';

  $dir = $data_path . $username . '/';
  $file_path = $dir . $file_name;
  checkDir($dir);

  if (!move_uploaded_file($tmp_file, $file_path))
    return 'failed to move uploaded file';

  $file_size = filesize($file_path);

  queryDB("INSERT INTO data (user_id, name, file_name, file_path, size) VALUES (%d, '%s', '%s', '%s', %d)",
          array($user_id, $name, $file_name, $file_path, $file_size));
}

?>

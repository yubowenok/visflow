<?php
/**
 * Provides data/diagram file writing/reading functions.
 */
include 'session.php';
include 'common.php';

function updateDataDB($data_id, $file_name, $data_name, $file_path, $file_size)
{
  global $user_id;
  if ($data_id == -1)
  {
    queryDB("INSERT INTO data (user_id, name, file_name, file_path, size) VALUES (%d, '%s', '%s', '%s', %d)",
            array($user_id, $data_name, $file_name, $file_path, $file_size));
    $row = getOneDB("SELECT LAST_INSERT_ID() AS id", array());
    return $row['id'];
  }
  else
  {
    queryDB("UPDATE data SET name='%s', file_name='%s', file_path='%s', size=%d, upload_time=FROM_UNIXTIME(%d) WHERE id=%d",
           array($data_name, $file_name, $file_path, $file_size, time(), $data_id));
    return $data_id;
  }
}

function saveDataUsername($data_id)
{
  global $username;
  if ($data_id == -1)
    // create new data under the current user
    $data_username = $username;
  else
    $data_username = getOneDB("SELECT username FROM ((SELECT user_id FROM data WHERE id=%d) AS T LEFT JOIN user "
                                 ."ON T.user_id = user.id)",
                                array($data_id))['username'];
  return $data_username;
}

function saveDataPaths($data_username, $file_name)
{
  $dir = DATA_PATH . $data_username . '/';
  $file_path = $dir . $file_name;
  $full_path = BASE_PATH . $file_path;
  check_dir(BASE_PATH . $dir);
  return array(
    'file_path' => $file_path,
    'full_path' => $full_path,
  );
}

function savePostedData($data_id, $file_name, $data_name, $data)
{
  $paths = saveDataPaths(saveDataUsername($data_id), $file_name);
  $full_path = $paths['full_path'];
  if (!file_put_contents($full_path, $data))
    abort('unable to write posted data');
  $file_size = filesize($full_path);
  return updateDataDB($data_id, $file_name, $data_name, $paths['file_path'], $file_size);
}

function saveUploadedData($data_id, $file_name, $data_name, $tmp_file)
{
  $paths = saveDataPaths(saveDataUsername($data_id), $file_name);
  $full_path = $paths['full_path'];
  if (!move_uploaded_file($tmp_file, $full_path))
    abort('failed to move uploaded file');
  $file_size = filesize($full_path);
  return updateDataDB($data_id, $file_name, $data_name, $paths['file_path'], $file_size);
}

function getData($data_id)
{
  $row = getOneDB("SELECT file_path FROM data WHERE id=%d",
                 array($data_id));
  if (!$row)
    abort('internal server error - data requested does not exist');

  $full_path = BASE_PATH . $row['file_path'];
  $contents = file_get_contents($full_path);
  if ($contents == false)
    abort('unable to get data contents');
  return $contents;
}

function deleteData($data_id)
{
  $row = getOneDB("SELECT file_path FROM data WHERE id=%d",
                 array($data_id));
  if (!$row)
    abort('internal server error - data to be deleted does not exist');

  $full_path = BASE_PATH . $row['file_path'];
  if (!@unlink($full_path))
    abort('cannot unlink data');
  queryDB("DELETE FROM data WHERE id=%d",
         array($data_id));
}

function getDataShareWith($data_id)
{
  $result = queryDB("SELECT username FROM ((SELECT user_id FROM share_data WHERE data_id=%d) AS T LEFT JOIN "
                    ."user ON T.user_id=user.id)",
                    array($data_id));
  $usernames = array();
  while ($row = $result->fetch_assoc())
  {
    array_push($usernames, $row['username']);
  }
  return join(', ', $usernames);
}

function updateDiagramDB($diagram_id, $diagram_name, $file_path)
{
  global $user_id;
  if ($diagram_id == -1)
  {
    queryDB("INSERT INTO diagram (user_id, name, file_path) VALUES (%d, '%s', '%s')",
            array($user_id, $diagram_name, $file_path));
    $row = getOneDB("SELECT LAST_INSERT_ID() AS id", array());
    return $row['id'];
  }
  else
  {
    queryDB("UPDATE diagram SET update_time=FROM_UNIXTIME(%d) WHERE id=%d",
           array(time(), $diagram_id));
    return $diagram_id;
  }
}

function saveDiagram($diagram_id, $diagram_name, $diagram)
{
  global $username;

  if ($diagram_id == -1)
    // create new diagram under the current user
    $diagram_username = $username;
  else
    $diagram_username = getOneDB("SELECT username FROM ((SELECT user_id FROM diagram WHERE id=%d) AS T LEFT JOIN user "
                                 ."ON T.user_id = user.id)",
                                array($diagram_id))['username'];

  $dir = DIAGRAM_PATH . $diagram_username . '/';
  $file_path = $dir . $diagram_name;
  $full_path = BASE_PATH . $file_path;
  check_dir(BASE_PATH . $dir);

  $file = fopen($full_path, 'w');
  if (!fwrite($file, $diagram))
    abort('cannot write to diagram file, no write permission');

  return updateDiagramDB($diagram_id, $diagram_name, $file_path);
}

function loadDiagram($diagram_id)
{
  $row = getOneDB("SELECT file_path FROM diagram WHERE id=%d",
                    array($diagram_id));
  if (!$row)
    abort('internal server error - diagram to be loaded does not exist');

  $file_path = $row['file_path'];
  $full_path = BASE_PATH . $file_path;
  if (!is_readable($full_path))
    abort('diagram file not readable' . $full_path);

  $contents = file_get_contents($full_path);
  if ($contents == false)
    abort('unable to get diagram contents');
  return json_decode($contents);
}

function deleteDiagram($diagram_id)
{
  $row = getOneDB("SELECT username, file_path FROM ((SELECT user_id, file_path FROM diagram WHERE id=%d) AS T LEFT JOIN "
                  ."user ON T.user_id=user.id)",
                 array($diagram_id));
  if (!$row)
    abort('internal server error - diagram to be deleted does not exist');

  $full_path = BASE_PATH . $row['file_path'];
  if (!@unlink($full_path))
    abort('cannot unlink diagram');
  queryDB("DELETE FROM diagram WHERE id=%d",
         array($diagram_id));
}

function getDiagramShareWith($diagram_id)
{
  $result = queryDB("SELECT username FROM ((SELECT user_id FROM share_diagram WHERE diagram_id=%d) AS T LEFT JOIN "
                    ."user ON T.user_id=user.id)",
                    array($diagram_id));
  $usernames = array();
  while ($row = $result->fetch_assoc())
  {
    array_push($usernames, $row['username']);
  }
  return join(', ', $usernames);
}

// convert shareWith usernames to user ids
function getShareWithUsernames($share_with)
{
  if (preg_match('/^\s*$/', $share_with))
    return array();
  if (!preg_match('/^([a-z0-9_]+,\s*)*[a-z0-9_]+$/', $share_with))
    abort('shareWith must be comma separated usernames');

  global $user_id;

  $usernames = preg_split('/,\s+/', $share_with);
  $user_ids = array();
  foreach ($usernames as $username)
  {
    $row = getOneDB("SELECT id FROM user WHERE username='%s'",
                array($username));
    if (!$row)
      abort('username "'.$username.'" does not exist');
    array_push($user_ids, $row['id']);
  }
  return $user_ids;
}

?>

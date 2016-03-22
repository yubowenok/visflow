<?php

include 'file.php';

checkLogin();

if (!isset($_POST['id']))
  abort('data id not set');
if (!isset($_POST['name']))
  abort('data name not set');
if (!isset($_POST['fileName']))
  abort('fileName not set');
if (!isset($_POST['shareWith']))
  abort('shareWith not set');

$data_id = $_POST['id'];
$data_name = $_POST['name'];
$file_name = $_POST['fileName'];
$share_user_ids = getShareWithUsernames($_POST['shareWith']);

if ($data_id != -1)
{
  if (!countDB("SELECT * FROM data WHERE id=%d",
              array($data_id)))
    abort('data to be updated does not exist');
}

if (isset($_FILES['file']))
{
  if ($_FILES['file']['size'] > $max_data_size)
    abort('file size should be no larger than '.$max_data_size_str);
  $tmp_file = $_FILES['file']['tmp_name'];

  $data_id = saveUploadedData($data_id, $file_name, $data_name, $tmp_file);
}
else if (isset($_POST['data']))
{
  $data = $_POST['data'];
  if (strlen($data) > $max_data_size)
    abort('data size should be no larger than '.$max_data_size_str);
  $data_id = savePostedData($data_id, $file_name, $data_name, $data);
}
else
{
  queryDB("UPDATE data SET name='%s', upload_time=FROM_UNIXTIME(%d) WHERE id=%d",
         array($data_name, time(), $data_id));
}

$data_author_id = getOneDB("SELECT user_id FROM data WHERE id=%d",
                          array($data_id));
// clear previous share_data entries
queryDB("DELETE FROM share_data WHERE data_id=%d",
       array($data_id));
// insert share_data entries
foreach ($share_user_ids as $share_user_id)
{
  if ($share_user_id == $data_author_id)
    continue;
  queryDB("INSERT IGNORE INTO share_data (data_id, user_id) VALUES (%d, %d)",
         array($data_id, $share_user_id));
}

status(200);

?>

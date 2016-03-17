<?php

include 'file.php';

checkLogin();

if (!isset($_POST['id']))
  abort('diagram id not set');
if (!isset($_POST['name']))
  abort('diagram name not set');
if (!isset($_POST['flow']))
  abort('flow not set');
if (!isset($_POST['shareWith']))
  abort('shareWith not set');

$flow = json_decode($_POST['flow']);
if ($flow == null)
  abort('cannot decode flow diagram json');

$share_user_ids = getShareWithUsernames($_POST['shareWith']);

$diagram_id = $_POST['id'];
$diagram_name = $_POST['name'];
if ($diagram_id == -1 && countDB("SELECT id FROM diagram WHERE user_id=%d AND name='%s'",
                                array($user_id, $diagram_name)))
  abort('attempt to save new diagram but duplicate diagram name found');

$row = getOneDB("SELECT name, user_id FROM diagram WHERE id=%d",
               array($diagram_id));

if ($row)
{
  // not new diagram, check privilege
  $row = getOneDB("SELECT user_id FROM diagram WHERE id=%d",
              array($diagram_id));
  if (!$row)
    abort('diagram id is not -1, but the diagram does not exist');
  if ($row['user_id'] != $user_id)
  {
    if (!countDB("SELECT * FROM share_diagram WHERE diagram_id=%d AND user_id=%d",
                array($diagram_id, $user_id)))
      abort('you cannot write to a diagram that is not shared with you');
  }
}

$diagram_id = saveDiagram($diagram_id, $diagram_name, $_POST['flow']);
$diagram_row = getOneDB("SELECT user_id, name FROM diagram WHERE id=%d",
                        array($diagram_id));
$diagram_name = $diagram_row['name'];
$diagram_author_id = $diagram_row['user_id'];

// clear previous share_diagram entries
queryDB("DELETE FROM share_diagram WHERE diagram_id=%d",
       array($diagram_id));
// insert share_diagram entries
foreach ($share_user_ids as $share_user_id)
{
  if ($share_user_id == $diagram_author_id)
    continue;
  queryDB("INSERT IGNORE INTO share_diagram (diagram_id, user_id) VALUES (%d, %d)",
         array($diagram_id, $share_user_id));
}

// insert share_data entries, share associated data with all shared-with users
foreach ($flow->data as $data_id)
{
  $data_author_id = getOneDB("SELECT user_id FROM data WHERE id=%d",
                     array($data_id))['user_id'];
  foreach ($share_user_ids as $share_user_id)
  {
    // If a shared user uses his/her own data in a shared diagram,
    // then do not share this data with this shared user.
    if ($data_author_id == $share_user_id)
      continue;
    queryDB("INSERT IGNORE INTO share_data (data_id, user_id) VALUES (%d, %d)",
           array($data_id, $share_user_id));
  }
  // If a shared user uses his/her own data in a shared diagram,
  // then share this dataset with diagram owner.
  if ($diagram_author_id != $data_author_id)
    queryDB("INSERT IGNORE INTO share_data (data_id, user_id) VALUES (%d, %d)",
           array($data_id, $diagram_author_id));
}

status(200);
contentType('json');
$response = array(
  'id' => $diagram_id,
  'name' => $diagram_name,
  'shareWith' => getDiagramShareWith($diagram_id),
  'user_id' => $share_user_ids,
);
echo json_encode($response);

?>

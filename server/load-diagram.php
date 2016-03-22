<?php

include 'file.php';

checkLogin();

if (!isset($_POST['id']))
  abort('diagram id not set');

$diagram_id = $_POST['id'];

$row = getOneDB("SELECT name, user_id FROM diagram WHERE id=%d",
               array($diagram_id));

if (!$row)
  abort('diagram to be loaded does not exist');

$diagram_name = $row['name'];

if ($row['user_id'] != $user_id)
{
  // current user is not the diagram owner
  if (!countDB("SELECT * FROM share_diagram WHERE diagram_id=%d AND user_id=%d",
              array($diagram_id, $user_id)))
    abort('this diagram is not shared with you');
}

$diagram = loadDiagram($diagram_id);

$response = array(
  'id' => $diagram_id,
  'name' => $diagram_name,
  'shareWith' => getDiagramShareWith($diagram_id),
  'diagram' => $diagram,
);
contentType('json');
echo json_encode($response);

?>

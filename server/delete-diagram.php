<?php

include 'file.php';

checkLogin();

if (!isset($_POST['id']))
  abort('diagram id not set');

$diagramId = $_POST['id'];
$row = getOneDB("SELECT user_id FROM diagram WHERE id=%d",
               array($diagramId));
if (!$row)
  abort('diagram to be deleted does not exit');
if ($row['user_id'] != $user_id)
  abort('you cannot delete a shared diagram');

deleteDiagram($diagramId);
status(200);

?>

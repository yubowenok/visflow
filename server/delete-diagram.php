<?php

include 'file.php';

checkLogin();

if (!isset($_POST['diagramName']))
  abort('diagramName not set');

deleteDiagram($_POST['diagramName']);
status(200);

?>

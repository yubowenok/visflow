<?php

include 'file.php';

checkLogin();

$diagram_name = $_POST['filename'];
$diagram = loadDiagram($diagram_name);

$response = array();
$response['diagram'] = $diagram;
contentType('json');
echo json_encode($response);

?>

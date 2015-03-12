<?php
  header('Content-Type: text/html; charset=utf-8');
  $index = file_get_contents("index.html");
  if (!isset($_GET['filename'])) {
    echo $index;
  } else {
    echo str_replace(
      "test()",
      "core.dataflowManager.downloadDataflow(\"".$_GET['filename']."\")",
      $index
    );
  }
?>
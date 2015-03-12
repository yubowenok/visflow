<?php

//header('Content-Type: text/html; charset=utf-8');

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


function get_client_ip() {
  $ipaddress = '';
  if (getenv('HTTP_CLIENT_IP'))
      $ipaddress = getenv('HTTP_CLIENT_IP');
  else if(getenv('HTTP_X_FORWARDED_FOR'))
      $ipaddress = getenv('HTTP_X_FORWARDED_FOR');
  else if(getenv('HTTP_X_FORWARDED'))
      $ipaddress = getenv('HTTP_X_FORWARDED');
  else if(getenv('HTTP_FORWARDED_FOR'))
      $ipaddress = getenv('HTTP_FORWARDED_FOR');
  else if(getenv('HTTP_FORWARDED'))
     $ipaddress = getenv('HTTP_FORWARDED');
  else if(getenv('REMOTE_ADDR'))
      $ipaddress = getenv('REMOTE_ADDR');
  else
      $ipaddress = 'unknown';
  return $ipaddress;
}

date_default_timezone_set('America/New_York');
$fp = fopen('dataflow.log', 'a');
$ip = get_client_ip();
echo $ip;
$date = date('m/d/Y h:i:s A', time());
fwrite($fp, "[$ip $date]");
if(isset($_GET["filename"])) {
  $x = $_GET["filename"];
  fwrite($fp, " filename=$x");
}
fwrite($fp, "\n");

?>
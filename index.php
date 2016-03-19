<?php

include 'server/response.php';

if($_SERVER['SERVER_PORT'] != 443)
{
  status(301);
  header('Location: https://'.$_SERVER['HTTP_HOST'].$_SERVER['REQUEST_URI']);
  exit();
}

echo file_get_contents('index.html');

function get_client_ip()
{
  $ip_address = '';
  if (getenv('HTTP_CLIENT_IP'))
    $ip_address = getenv('HTTP_CLIENT_IP');
  else if(getenv('HTTP_X_FORWARDED_FOR'))
    $ip_address = getenv('HTTP_X_FORWARDED_FOR');
  else if(getenv('HTTP_X_FORWARDED'))
    $ip_address = getenv('HTTP_X_FORWARDED');
  else if(getenv('HTTP_FORWARDED_FOR'))
    $ip_address = getenv('HTTP_FORWARDED_FOR');
  else if(getenv('HTTP_FORWARDED'))
    $ip_address = getenv('HTTP_FORWARDED');
  else if(getenv('REMOTE_ADDR'))
    $ip_address = getenv('REMOTE_ADDR');
  else
    $ip_address = 'unknown';
  return $ip_address;
}

date_default_timezone_set('America/New_York');
$fp = fopen('visit.log', 'a');
$ip = get_client_ip();
$date = date('m/d/Y h:i:s A', time());
$user = getenv('REMOTE_USER');
fwrite($fp, "[$user $ip $date ts=".time().']');
if(isset($_GET['diagram']))
{
  $x = $_GET['diagram'];
  fwrite($fp, " diagram=$x");
}
fwrite($fp, "\n");

?>

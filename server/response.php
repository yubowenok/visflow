<?php

function status($code) {
  switch ($code) {
    case 500:
      header('HTTP/1.1 500 Internal Server Error');
      break;
    case 403:
      header('HTTP/1.1 403 Forbidden');
      break;
    case 301:
      header('HTTP/1.1 301 Moved Permanently');
      break;
  }
}

function contentType($type) {
  switch ($type) {
    case 'json':
      header('Content-type: application/json');
      break;
    case 'text':
      header('Content-type: text/plain');
      break;
  }
}

function abort($msg) {
  status(500);
  contentType('text');
  echo $msg;
  exit();
}

?>

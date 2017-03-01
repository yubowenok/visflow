<?php

include 'session.php';
include 'common.php';

const NLP_URL = 'http://localhost:8400/sempre?q=';

if (!isset($_POST['query']))
  abort('no query found');

$query = $_POST['query'];
$query_md5 = md5($query);
$query_in = BASE_PATH . NLP_PATH . $query_md5;
$query_out = $query_in . '.out';

file_put_contents($query_in, $query); // Only for records
$query_q = preg_replace('/\s+/', '+', $query);

$cmd = "curl '" . NLP_URL . "$query_q'";

$result_lines = [];
exec($cmd, $result_lines);
$result = implode("\n", $result_lines);

echo $result;
file_put_contents($query_out, $result);
?>
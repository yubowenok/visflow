<?php

$base_path = '/data/visflow/';
$data_path = 'data/';
$diagram_path = 'diagrams/';

$min_username_length = 6;
$min_password_length = 8;
$max_data_size = 20 * 1000000;
$max_data_size_str = '20M';

$file = fopen('config', 'r');
if ($file)
{
  while (($line = fgets($file)) !== false) {
    $line = preg_replace('/\s+/', '', $line);
    $tokens = preg_split('/=/', $line);
    if (sizeof($tokens) < 2)
      continue;
    $var = $tokens[0];
    $val = $tokens[1];
    switch ($var)
    {
      case 'base_path':
        $base_path = $val;
        break;
      case 'data_path':
        $data_path = $val;
        break;
      case 'diagram_path':
        $diagram_path = $val;
        break;
    }
  }
  fclose($file);
}

?>

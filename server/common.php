<?php
/**
 * Common limits and paths.
 * This shall be included wherever limits and paths are used.
 */

// Default paths.
// If server/config exists, then use the paths defined in the file.
$base_path = '/data/visflow/';
$data_path = 'data/';
$diagram_path = 'diagrams/';
$nlp_path = 'nlp/';

$min_username_length = 6;
$min_password_length = 8;
$max_data_size = 50 * 1000000;
$max_data_size_str = '50M';

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
      case 'nlp_path':
        $nlp_path = $val;
        break;
    }
  }
  fclose($file);
}

function check_dir($dir)
{
  if (!is_dir($dir))
    mkdir($dir, 0744, true);
}

define('BASE_PATH', $base_path);
define('DATA_PATH', $data_path);
define('DIAGRAM_PATH', $diagram_path);
define('NLP_PATH', $nlp_path);

check_dir(BASE_PATH . DATA_PATH);
check_dir(BASE_PATH . DIAGRAM_PATH);
check_dir(BASE_PATH . NLP_PATH);

?>

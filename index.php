<?php

include 'server/session.php';

function isMobile(){
  $keywords = array(
    '/iphone/i' => 'iPhone',
    '/ipod/i' => 'iPod',
    '/ipad/i' => 'iPad',
    '/android/i' => 'Android',
    '/blackberry/i' => 'BlackBerry',
    '/webos/i' => 'Mobile'
  );
  foreach($keywords as $key => $val)
  {
    if (preg_match($key, $_SERVER['HTTP_USER_AGENT']))
      return true;
  }
  return false;
}

echo file_get_contents('index.html');

?>

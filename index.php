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

if (isMobile())
  echo '<h1>Sorry, but we currently do not support mobile devices.</h1>';
else
  echo file_get_contents('index.html');

?>

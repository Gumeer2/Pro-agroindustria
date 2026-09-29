<?php
$content = file_get_contents('public/build/assets/Index-BTGEk4Qp.js');
$pos = strpos($content, 'e.jsx(z,{show:!!c');
echo substr($content, $pos, 200) . PHP_EOL;
?>

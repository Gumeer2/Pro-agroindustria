<?php
$content = file_get_contents('public/build/assets/Index-BTGEk4Qp.js');
$pos = strpos($content, 'N(x.toISOString().slice(0,16))},className:"text-white bg-red-600');
echo substr($content, $pos, 250) . PHP_EOL;
?>

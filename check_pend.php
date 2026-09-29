<?php
$content = file_get_contents('public/build/assets/Index-BTGEk4Qp.js');
$pos = strpos($content, 't.status==="pending"&&t.notes&&e.jsxs');
echo substr($content, $pos, 250) . PHP_EOL;
?>

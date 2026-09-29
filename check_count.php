<?php
$content = file_get_contents('public/build/assets/Index-BTGEk4Qp.js');
echo 'Count: ' . substr_count($content, 'export{ke as default};') . PHP_EOL;
?>

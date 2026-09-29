<?php
$content = file_get_contents('public/build/assets/Index-BTGEk4Qp.js');
echo 'Count of !!c : ' . substr_count($content, 'e.jsx(z,{show:!!c') . PHP_EOL;
?>

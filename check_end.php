<?php
$file = 'public/build/assets/Index-BTGEk4Qp.js';
$content = file_get_contents($file);
$str = substr($content, -40);
for ($i=0; $i<strlen($str); $i++) {
    echo $str[$i] . ' ';
}
echo PHP_EOL;
?>

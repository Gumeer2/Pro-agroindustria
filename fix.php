<?php
$file = 'public/build/assets/Index-BTGEk4Qp.js';
$content = file_get_contents($file);
$content = str_replace('children:"Cerrar"})})]})})]}export', 'children:"Cerrar"})})]})})]})}export', $content);
file_put_contents($file, $content);
echo "Fixed!";
?>

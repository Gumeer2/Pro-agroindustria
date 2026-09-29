<?php
$content = file_get_contents('public/build/assets/Index-BTGEk4Qp.js');
$pos = strpos($content, 'children:[e.jsx(O,{className:"w-3 h-3 mr-1.5"}),"Vetar"]}):e.jsxs(e.Fragment,{children:[e.jsx(te,{className:"w-3 h-3 mr-1.5"}),"Activar"]})})]})]},t.id)');
echo substr($content, $pos, 250) . PHP_EOL;
?>

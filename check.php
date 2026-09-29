<?php
$content = file_get_contents('public/build/assets/Index-BTGEk4Qp.js');

$stack = [];
$map = ['}' => '{', ']' => '[', ')' => '('];
$inString = false;
$stringChar = '';
$escape = false;
$templateStack = []; // for `${` inside backticks

for($i=0; $i<strlen($content); $i++) {
    $c = $content[$i];
    
    if (!$inString) {
        if ($c == '"' || $c == "'" || $c == '`') {
            $inString = true;
            $stringChar = $c;
        } elseif ($c == '{' || $c == '[' || $c == '(') {
            $stack[] = ['char' => $c, 'pos' => $i];
        } elseif ($c == '}' || $c == ']' || $c == ')') {
            if (empty($stack)) {
                echo "Unexpected $c at pos $i\n";
                $snippet = substr($content, max(0, $i - 30), 60);
                echo "Context: $snippet\n";
                continue;
            }
            $top = array_pop($stack);
            if ($top['char'] != $map[$c]) {
                echo "Mismatched $c at pos $i (expected closing for " . $top['char'] . " at " . $top['pos'] . ")\n";
                $snippet = substr($content, max(0, $i - 30), 60);
                echo "Context: $snippet\n";
                exit(1);
            }
        }
    } else {
        if ($escape) {
            $escape = false;
        } elseif ($c == '\\') {
            $escape = true;
        } elseif ($c == $stringChar) {
            $inString = false;
        } elseif ($stringChar == '`' && $c == '$' && $i+1 < strlen($content) && $content[$i+1] == '{') {
            // we'll just ignore template literal interpolation for this basic script, 
            // since we don't have deep nesting. Wait, template literals contain `{` and `}`!
            // if we ignore them, we might get false mismatches if the template has unbalanced `{`.
        }
    }
}
echo "Remaining unclosed: \n";
foreach($stack as $s) {
    echo $s['char'] . " at " . $s['pos'] . "\n";
    $snippet = substr($content, max(0, $s['pos'] - 10), 20);
    echo "Context: $snippet\n";
}
?>

<?php
// check_version.php - Check file modification times

echo "<h1>File Version Check</h1>";
echo "<p>Current Server Time: " . date('Y-m-d H:i:s') . "</p>";

$files = [
    'routes/web.php',
    'app/Http/Controllers/WeightTicketController.php',
    'resources/js/Pages/Scale/EntryMP.tsx',
    'resources/js/Pages/Scale/Index.tsx'
];

echo "<table border='1' cellpadding='10'>";
echo "<tr><th>File</th><th>Exists?</th><th>Last Modified</th><th>Size (bytes)</th></tr>";

foreach ($files as $file) {
    echo "<tr>";
    echo "<td>" . $file . "</td>";
    if (file_exists(__DIR__ . '/' . $file)) {
        echo "<td style='color: green;'>YES</td>";
        echo "<td>" . date('Y-m-d H:i:s', filemtime(__DIR__ . '/' . $file)) . "</td>";
        echo "<td>" . filesize(__DIR__ . '/' . $file) . "</td>";
    } else {
        echo "<td style='color: red;'>NO</td>";
        echo "<td>-</td>";
        echo "<td>-</td>";
    }
    echo "</tr>";
}
echo "</table>";

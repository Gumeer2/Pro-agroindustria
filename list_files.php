<?php
/**
 * Script de diagnóstico para verificar estructura de directorios
 * y ubicación de archivos en el servidor.
 */

echo "<!DOCTYPE html>";
echo "<html><head>";
echo "<title>Diagnóstico de Estructura - VECODE</title>";
echo "<style>";
echo "body { font-family: monospace; padding: 20px; background: #f5f5f5; }";
echo "pre { background: white; padding: 15px; border: 1px solid #ddd; border-radius: 4px; overflow-x: auto; }";
echo "h2 { color: #333; border-bottom: 2px solid #007bff; padding-bottom: 5px; }";
echo ".success { color: #28a745; }";
echo ".error { color: #dc3545; }";
echo "</style>";
echo "</head><body>";

echo "<h1>🔍 Diagnóstico de Estructura del Servidor</h1>";

// 1. Directorio actual
echo "<h2>1. Directorio Actual</h2>";
echo "<pre>";
echo "Ruta absoluta: " . __DIR__ . "\n";
echo "Ruta real: " . realpath(__DIR__) . "\n";
echo "</pre>";

// 2. Archivos en directorio actual
echo "<h2>2. Archivos en Directorio Actual</h2>";
echo "<pre>";
$files = scandir(__DIR__);
foreach ($files as $file) {
    if ($file === '.' || $file === '..')
        continue;
    $path = __DIR__ . '/' . $file;
    $type = is_dir($path) ? '[DIR]' : '[FILE]';
    $size = is_file($path) ? ' (' . round(filesize($path) / 1024, 2) . ' KB)' : '';
    echo "$type $file$size\n";
}
echo "</pre>";

// 3. Buscar archivos clave
echo "<h2>3. Archivos Clave del Despliegue</h2>";
echo "<pre>";
$keyFiles = [
    'release.zip',
    'extract.php',
    'fix_perms.php',
    'migrate.php',
    'deployment_test.php',
    'debug_final.php',
    'vendor/autoload.php',
    'public/build/manifest.json'
];

foreach ($keyFiles as $file) {
    $fullPath = __DIR__ . '/' . $file;
    if (file_exists($fullPath)) {
        $size = is_file($fullPath) ? ' (' . round(filesize($fullPath) / 1024, 2) . ' KB)' : '';
        echo "<span class='success'>✅ $file$size</span>\n";
    } else {
        echo "<span class='error'>❌ $file (NO ENCONTRADO)</span>\n";
    }
}
echo "</pre>";

// 4. Directorio padre
echo "<h2>4. Directorio Padre</h2>";
echo "<pre>";
$parentDir = dirname(__DIR__);
echo "Ruta: $parentDir\n\n";
$parentFiles = scandir($parentDir);
foreach ($parentFiles as $file) {
    if ($file === '.' || $file === '..')
        continue;
    $path = $parentDir . '/' . $file;
    $type = is_dir($path) ? '[DIR]' : '[FILE]';
    echo "$type $file\n";
}
echo "</pre>";

// 5. Variables de servidor
echo "<h2>5. Variables del Servidor</h2>";
echo "<pre>";
echo "DOCUMENT_ROOT: " . $_SERVER['DOCUMENT_ROOT'] . "\n";
echo "SCRIPT_FILENAME: " . $_SERVER['SCRIPT_FILENAME'] . "\n";
echo "SERVER_NAME: " . $_SERVER['SERVER_NAME'] . "\n";
echo "PHP_VERSION: " . phpversion() . "\n";
echo "</pre>";

// 6. Permisos
echo "<h2>6. Permisos del Directorio Actual</h2>";
echo "<pre>";
$perms = fileperms(__DIR__);
echo "Permisos: " . substr(sprintf('%o', $perms), -4) . "\n";
echo "Escribible: " . (is_writable(__DIR__) ? "✅ SÍ" : "❌ NO") . "\n";
echo "</pre>";

echo "<hr>";
echo "<p><small>Timestamp: " . date('Y-m-d H:i:s') . "</small></p>";
echo "</body></html>";

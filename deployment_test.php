<?php
/**
 * TEST DE DESPLIEGUE - VECODE
 * 
 * Este archivo sirve para verificar que el despliegue está funcionando.
 * Si ves este mensaje, significa que GitHub Actions está desplegando correctamente.
 * 
 * Timestamp de creación: <?php echo date('Y-m-d H:i:s'); ?>
 */

echo "<html>";
echo "<head>";
echo "<title>Test de Despliegue VECODE</title>";
echo "<style>";
echo "body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; background: #f5f5f5; }";
echo ".success { background: #d4edda; border: 2px solid #28a745; padding: 20px; border-radius: 8px; }";
echo ".info { background: #d1ecf1; border: 2px solid #17a2b8; padding: 15px; border-radius: 8px; margin-top: 20px; }";
echo "h1 { color: #28a745; }";
echo "code { background: #fff; padding: 2px 6px; border-radius: 3px; border: 1px solid #ddd; }";
echo "</style>";
echo "</head>";
echo "<body>";

echo "<div class='success'>";
echo "<h1>✅ Despliegue Funcionando Correctamente</h1>";
echo "<p><strong>Timestamp:</strong> " . date('Y-m-d H:i:s') . "</p>";
echo "<p><strong>Servidor:</strong> " . $_SERVER['SERVER_NAME'] . "</p>";
echo "<p><strong>PHP Version:</strong> " . phpversion() . "</p>";
echo "</div>";

echo "<div class='info'>";
echo "<h2>📋 Información del Despliegue</h2>";
echo "<p>Este archivo fue creado para probar el pipeline de despliegue.</p>";
echo "<p><strong>Proceso:</strong></p>";
echo "<ol>";
echo "<li>Código pusheado a GitHub (rama <code>main</code>)</li>";
echo "<li>GitHub Actions compila assets y crea <code>release.zip</code></li>";
echo "<li>FTP sube el ZIP a Hostinger</li>";
echo "<li><code>extract.php</code> descomprime los archivos</li>";
echo "<li><code>fix_perms.php</code> corrige permisos</li>";
echo "<li><code>migrate.php</code> ejecuta migraciones</li>";
echo "</ol>";
echo "<p><strong>Si estás viendo este mensaje, el despliegue está funcionando. ✅</strong></p>";
echo "</div>";

echo "<div class='info'>";
echo "<h2>🔗 Enlaces Útiles</h2>";
echo "<ul>";
echo "<li><a href='/VECODE/extract.php'>Ver logs de extract.php</a></li>";
echo "<li><a href='/VECODE/fix_perms.php'>Ver logs de fix_perms.php</a></li>";
echo "<li><a href='/VECODE/debug_final.php'>Diagnóstico completo</a></li>";
echo "<li><a href='/VECODE/'>Volver a VECODE</a></li>";
echo "</ul>";
echo "</div>";

echo "<p style='text-align: center; color: #666; margin-top: 40px;'>";
echo "<small>⚠️ Elimina este archivo después de verificar: <code>deployment_test.php</code></small>";
echo "</p>";

echo "</body>";
echo "</html>";

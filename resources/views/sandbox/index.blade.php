<?php
    // =============== ZONA DE LÓGICA ===============
    // Puedes colocar toda la lógica de negocio, procesamiento de formularios
    // y consultas a la base de datos en esta misma sección.
    use Illuminate\Support\Facades\DB;
    
    // Ejemplo de consulta directa a la base de datos:
    // La conexión se maneja automáticamente de forma segura.
    $usuarios_ejemplo = DB::select("SELECT id, name, email FROM users LIMIT 5");
?>
<!DOCTYPE html>
<html lang="es">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard - Espacio de Trabajo</title>
    <!-- Agrega aquí tus hojas de estilo CSS o librerías como Bootstrap -->
    <style>
        body { font-family: sans-serif; background-color: #f3f4f6; margin: 0; padding: 2rem; }
        .container { background-color: white; padding: 2rem; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); max-width: 800px; margin: auto; }
        .info-box { background-color: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 1rem; margin-top: 1.5rem; }
        h1 { color: #1e3a8a; }
        table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
    </style>
</head>

<body>

    <div class="container">
        <h1>Tu Espacio de Trabajo</h1>

        <p><strong>Estado:</strong> <?php echo $message; ?></p>

        <hr style="margin: 2rem 0;">

        <h3>Ejemplo: Consultar la Base de Datos</h3>
        <p>Puedes abrir este archivo (<code>resources/views/sandbox/index.blade.php</code>) para ver cómo está estructurada esta página. La conexión a la base de datos principal ya está configurada; solo necesitas ejecutar tus sentencias SQL usando <code>DB::select()</code>.</p>
        
        <table>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Nombre</th>
                    <th>Email</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach ($usuarios_ejemplo as $usuario): ?>
                    <tr>
                        <td><?php echo $usuario->id; ?></td>
                        <td><?php echo $usuario->name; ?></td>
                        <td><?php echo $usuario->email; ?></td>
                    </tr>
                <?php endforeach; ?>
            </tbody>
        </table>

        <hr style="margin: 2rem 0;">

        <h3>Guía Rápida</h3>
        <p>Este entorno está diseñado para que construyas y valides tus módulos utilizando PHP y HTML estándar de inmediato.</p>

        <div class="info-box">
            <h4>¿Cómo estructurar tu trabajo?</h4>
            <ul>
                <li><strong>Desarrollo centralizado:</strong> Si lo prefieres, puedes estructurar todo el ciclo (validación de peticiones, lógica de negocio y presentación) en la cabecera de este mismo archivo, abriendo las etiquetas <code>&lt;?php ... ?&gt;</code>.</li>
                <li><strong>Consultas a la BD:</strong> Utiliza el Facade <code>DB</code>. Cuentas con métodos como <code>DB::select("SELECT ...")</code>, <code>DB::insert(...)</code>, y <code>DB::update(...)</code> que interactúan directamente con la base de datos del sistema.</li>
                <li><strong>Organización:</strong> Puedes crear tantos archivos <code>.blade.php</code> como necesites dentro de <code>resources/views/sandbox/</code> para mantener tus pantallas organizadas.</li>
            </ul>
        </div>

        <p style="margin-top: 2rem; font-size: 0.9em; color: gray;">
            <em>Nota: Una vez que termines el flujo de trabajo y la interfaz esté validada aquí, avisa al equipo para integrar tu desarrollo con el resto de la arquitectura del proyecto.</em>
        </p>

    </div>

</body>

</html>
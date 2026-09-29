<?php
// migrate_db.php
// Tool to migrate data from Old DB (v2) to New DB (v3)

// 1. Load Current Env
function parseEnv($path) {
    if (!file_exists($path)) return null;
    $content = file_get_contents($path);
    $lines = explode("\n", $content);
    $env = [];
    foreach ($lines as $line) {
        $line = trim($line);
        if (empty($line) || strpos($line, '#') === 0) continue;
        $parts = explode('=', $line, 2);
        if (count($parts) === 2) {
            $env[trim($parts[0])] = trim($parts[1]);
        }
    }
    return $env;
}

$currentEnv = parseEnv(__DIR__ . '/../../.env');
$targetDb = $currentEnv['DB_DATABASE'] ?? 'u174025152_vecode';
$targetUser = $currentEnv['DB_USERNAME'] ?? 'u174025152_vecode_';
// We will ask for this manually to avoid parsing validation issues
$targetPassAuto = $currentEnv['DB_PASSWORD'] ?? ''; 
$host = $currentEnv['DB_HOST'] ?? '127.0.0.1';

// Hardcoded Source Config based on User Screenshot
$sourceDb = 'u174025152_vecode_v2';
$sourceUser = 'u174025152_admin_v2';

$message = "";

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $sourcePass = $_POST['source_password'] ?? '';
    // Prefer manual input, fallback to auto if user left blank (optional)
    $targetPassInput = $_POST['target_password'] ?? ''; 
    $targetPass = !empty($targetPassInput) ? $targetPassInput : $targetPassAuto;

    if (empty($sourcePass)) {
        $message = "Error: Password required.";
    } else {
        try {
            // Connect to Target
            $pdoTarget = new PDO("mysql:host=$host;dbname=$targetDb;charset=utf8mb4", $targetUser, $targetPass);
            $pdoTarget->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

            // Connect to Source
            $pdoSource = new PDO("mysql:host=$host;dbname=$sourceDb;charset=utf8mb4", $sourceUser, $sourcePass);
            $pdoSource->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

            $message .= "<div style='color:green'>Connections Successful! Starting Migration...</div><br>";

            // Tables to Migrate (Order matters for foreign keys!)
            // We disable FK checks to make it easier
            $tables = [
                'users',
                'clients',
                'products',
                'transporters',
                'drivers',
                'vehicles',
                'sales_orders', // Assuming this matches old schema name? Need to verify.
                'weight_tickets',
                // Add permissions/roles tables if needed, but Seeder usually handles structure. Data might be needed.
            ];

            $pdoTarget->exec("SET FOREIGN_KEY_CHECKS=0");

            foreach ($tables as $table) {
                try {
                    // 1. Get Data from Source
                    // Check if table exists in source
                    $stmtCheck = $pdoSource->query("SHOW TABLES LIKE '$table'");
                    if ($stmtCheck->rowCount() == 0) {
                        $message .= "Skipping $table (Not found in source)<br>";
                        continue;
                    }

                    $stmt = $pdoSource->query("SELECT * FROM $table");
                    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
                    
                    if (count($rows) > 0) {
                        // 2. Truncate Target
                        $pdoTarget->exec("TRUNCATE TABLE $table");

                        // 3. Insert Data
                        $columns = array_keys($rows[0]);
                        $colList = implode(", ", $columns);
                        $placeholders = implode(", ", array_fill(0, count($columns), "?"));
                        
                        $sqlInsert = "INSERT INTO $table ($colList) VALUES ($placeholders)";
                        $stmtInsert = $pdoTarget->prepare($sqlInsert);

                        $count = 0;
                        foreach ($rows as $row) {
                            $stmtInsert->execute(array_values($row));
                            $count++;
                        }
                        $message .= "Migrated <b>$count</b> rows for table <b>$table</b>.<br>";
                    } else {
                        $message .= "Table <b>$table</b> is empty in source.<br>";
                    }

                } catch (Exception $e) {
                    $message .= "<div style='color:red'>Error migrating $table: " . $e->getMessage() . "</div><br>";
                }
            }

            $pdoTarget->exec("SET FOREIGN_KEY_CHECKS=1");
            $message .= "<br><b>Migration Completed!</b>";

        } catch (PDOException $e) {
            $message = "<div style='color:red'>Database Connection Error: " . $e->getMessage() . "</div>";
        }
    }
}

?>

<!DOCTYPE html>
<html>
<head>
    <title>VECODE Migration Tool</title>
    <style>
        body { font-family: sans-serif; padding: 40px; background: #f0f2f5; }
        .card { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); max-width: 500px; margin: 0 auto; }
        input { width: 100%; padding: 10px; margin: 10px 0; border: 1px solid #ddd; rounded: 4px; box-sizing: border-box; }
        button { wudth: 100%; padding: 12px; background: #4f46e5; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; }
        button:hover { background: #4338ca; }
        .log { background: #1e1e1e; color: #0f0; padding: 15px; border-radius: 4px; margin-top: 20px; font-family: monospace; white-space: pre-wrap; }
    </style>
</head>
<body>
    <div class="card">
        <h2>🛠️ Migrar Base de Datos</h2>
        <p><b>Origen:</b> <?php echo $sourceDb; ?> (User: <?php echo $sourceUser; ?>)</p>
        <p><b>Destino:</b> <?php echo $targetDb; ?></p>
        
        <form method="POST">
            <div style="margin-bottom: 20px; padding: 10px; background: #e0e7ff; border-radius: 4px;">
                <label><b>1. Contraseña BASE DE DATOS ACTUAL (Destino):</b></label><br>
                <small>Usuario: <?php echo $targetUser; ?></small>
                <input type="password" name="target_password" placeholder="Contraseña del .env actual..." required>
            </div>

            <div style="margin-bottom: 20px; padding: 10px; background: #fef3c7; border-radius: 4px;">
                <label><b>2. Contraseña BASE DE DATOS ANTIGUA (Origen):</b></label><br>
                <small>Usuario: <?php echo $sourceUser; ?></small>
                <input type="password" name="source_password" placeholder="Contraseña de la BD antigua..." required>
            </div>

            <button type="submit">Iniciar Migración</button>
        </form>

        <?php if ($message): ?>
            <div class="log">
                <?php echo $message; ?>
            </div>
        <?php endif; ?>
    </div>
</body>
</html>

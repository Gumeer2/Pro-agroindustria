<?php
$host = "127.0.0.1";
$user = "root";
$pass = "";
$db = "vecode";

try {
    $pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8mb4", $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);
    echo "✅ Connected to $db\n\n";
} catch (Exception $e) {
    die("❌ Connection failed: " . $e->getMessage());
}

$vessel_name = "Nordorinoco";
echo "--- Checking Vessel: $vessel_name ---\n";
$stmt = $pdo->prepare("SELECT id, name FROM vessels WHERE name LIKE ?");
$stmt->execute(["%$vessel_name%"]);
$vessel = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$vessel) {
    die("❌ Vessel not found.\n");
}

$vessel_id = $vessel['id'];
echo "Found Vessel ID: $vessel_id\n";

// Check for date 19 in ANY relevant date field
$dates = ['created_at', 'updated_at'];
foreach ($dates as $date_col) {
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM shipment_orders WHERE vessel_id = ? AND DATE($date_col) = '2026-01-19'");
    $stmt->execute([$vessel_id]);
    echo "Shipment Orders with $date_col on 2026-01-19: " . $stmt->fetchColumn() . "\n";
}

$wt_dates = ['weigh_in_at', 'weigh_out_at', 'created_at', 'updated_at'];
foreach ($wt_dates as $date_col) {
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM weight_tickets wt JOIN shipment_orders so ON wt.shipment_order_id = so.id WHERE so.vessel_id = ? AND DATE(wt.$date_col) = '2026-01-19'");
    $stmt->execute([$vessel_id]);
    echo "Weight Tickets with $date_col on 2026-01-19: " . $stmt->fetchColumn() . "\n";
}

// Check for ANY completed orders for this vessel
$stmt = $pdo->prepare("SELECT COUNT(*) FROM shipment_orders WHERE vessel_id = ? AND status = 'completed'");
$stmt->execute([$vessel_id]);
echo "\nTotal COMPLETED orders for this vessel: " . $stmt->fetchColumn() . "\n";

?>
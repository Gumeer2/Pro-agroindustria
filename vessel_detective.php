<?php
$user = "root";
$pass = "";
$db = "vecode";

try {
    $pdo = new PDO("mysql:host=127.0.0.1;dbname=$db;charset=utf8mb4", $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);
} catch (Exception $e) {
    die("Connection failed: " . $e->getMessage());
}

echo "--- VESSELS LIST ---\n";
$stmt = $pdo->query("SELECT id, name, created_at FROM vessels WHERE name LIKE '%Nord%'");
while ($v = $stmt->fetch(PDO::FETCH_ASSOC)) {
    echo "Vessel ID: {$v['id']} | Name: {$v['name']} | Created: {$v['created_at']}\n";

    // Check for Jan 19 data for THIS vessel
    $q = "SELECT COUNT(*) FROM shipment_orders so JOIN weight_tickets wt ON so.id = wt.shipment_order_id WHERE so.vessel_id = ? AND DATE(wt.weigh_out_at) = '2026-01-19'";
    $s2 = $pdo->prepare($q);
    $s2->execute([$v['id']]);
    $count = $s2->fetchColumn();
    echo "  > Jan 19 Records: $count\n";

    if ($count > 0) {
        $q3 = "SELECT so.folio, wt.weigh_out_at, so.status FROM shipment_orders so JOIN weight_tickets wt ON so.id = wt.shipment_order_id WHERE so.vessel_id = ? AND DATE(wt.weigh_out_at) = '2026-01-19'";
        $s3 = $pdo->prepare($q3);
        $s3->execute([$v['id']]);
        while ($r = $s3->fetch(PDO::FETCH_ASSOC)) {
            echo "    - Folio: {$r['folio']} | Date: {$r['weigh_out_at']} | Status: {$r['status']}\n";
        }
    }
}

echo "\n--- GLOBAL SCAN FOR JAN 19 (Any vessel) ---\n";
$q4 = "SELECT v.name, so.folio, wt.weigh_out_at FROM shipment_orders so JOIN weight_tickets wt ON so.id = wt.shipment_order_id JOIN vessels v ON so.vessel_id = v.id WHERE DATE(wt.weigh_out_at) = '2026-01-19'";
$stmt4 = $pdo->query($q4);
while ($r = $stmt4->fetch(PDO::FETCH_ASSOC)) {
    echo "Vessel: {$r['name']} | Folio: {$r['folio']} | Date: {$r['weigh_out_at']}\n";
}
?>
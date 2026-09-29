<?php
$mysqli = new mysqli("127.0.0.1", "root", "", "vecode_v2");
if ($mysqli->connect_errno) {
    echo "Failed to connect to MySQL (127.0.0.1): " . $mysqli->connect_error . "\n";
    $mysqli = new mysqli("localhost", "root", "", "vecode_v2");
    if ($mysqli->connect_errno) {
        echo "Failed to connect to MySQL (localhost): " . $mysqli->connect_error . "\n";
    } else {
        echo "Connected to MySQL via localhost\n";
        queryVessels($mysqli);
    }
} else {
    echo "Connected to MySQL via 127.0.0.1\n";
    queryVessels($mysqli);
}

function queryVessels($mysqli)
{
    $result = $mysqli->query("SELECT id, name FROM vessels");
    while ($row = $result->fetch_assoc()) {
        echo "ID: " . $row['id'] . " - Name: " . $row['name'] . "\n";
    }
}

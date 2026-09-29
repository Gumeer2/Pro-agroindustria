<?php
header('Content-Type: text/plain');

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

echo "--- DATABASE CONFIGURATION INSPECTOR ---\n\n";

// 1. Current Root Environment (One level up from public/)
$currentPath = realpath(__DIR__ . '/../.env'); 
echo "Checking Current Root .env (" . ($currentPath ?: 'NOT FOUND at ' . __DIR__ . '/../.env') . "): ";
$currentEnv = parseEnv($currentPath ?: __DIR__ . '/../.env');

if ($currentEnv) {
    echo "FOUND\n";
    echo "DB_HOST: " . ($currentEnv['DB_HOST'] ?? 'N/A') . "\n";
    echo "DB_DATABASE: " . ($currentEnv['DB_DATABASE'] ?? 'N/A') . "\n";
    echo "DB_USERNAME: " . ($currentEnv['DB_USERNAME'] ?? 'N/A') . "\n";
} else {
    echo "NOT FOUND\n";
}

echo "\n----------------------------------------\n\n";

// 2. Old Subfolder Environment (Sibling of public/)
$oldPath = realpath(__DIR__ . '/../VECODE/.env');
echo "Checking Old Subfolder .env (" . ($oldPath ?: 'NOT FOUND at ' . __DIR__ . '/../VECODE/.env') . "): ";
$oldEnv = parseEnv($oldPath ?: __DIR__ . '/../VECODE/.env');

if ($oldEnv) {
    echo "FOUND\n";
    echo "DB_HOST: " . ($oldEnv['DB_HOST'] ?? 'N/A') . "\n";
    echo "DB_DATABASE: " . ($oldEnv['DB_DATABASE'] ?? 'N/A') . "\n";
    echo "DB_USERNAME: " . ($oldEnv['DB_USERNAME'] ?? 'N/A') . "\n";
} else {
    echo "NOT FOUND (The folder /VECODE/ might have been deleted or moved)\n";
}

echo "\n----------------------------------------\n\n";

if ($currentEnv && $oldEnv) {
    if ($currentEnv['DB_DATABASE'] === $oldEnv['DB_DATABASE']) {
        echo "CONCLUSION: BOTH ENVIRONMENTS SHARE THE SAME DATABASE.\n";
        echo "Data migration is NOT needed. You are already seeing the old data.\n";
    } else {
        echo "CONCLUSION: DIFFERENT DATABASES DETECTED.\n";
        echo "Migration from '" . $oldEnv['DB_DATABASE'] . "' to '" . $currentEnv['DB_DATABASE'] . "' is required.\n";
    }
}

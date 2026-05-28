<?php
require_once __DIR__ . '/config.php';
$db = getDB();
$tables = $db->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
$counts = [];
foreach ($tables as $t) {
  $counts[$t] = $db->query("SELECT COUNT(*) FROM `$t`")->fetchColumn();
}
jsonOk(['message' => 'SurakshaKarnataka API working!', 'tables' => $counts]);

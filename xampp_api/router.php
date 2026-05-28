<?php
$file = __DIR__ . parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
if (is_file($file)) {
    return false; // serve the file directly
}
require __DIR__ . '/api.php';

<?php

// uncomment this line if you must temporarily take down your site for maintenance
// require '.maintenance.php';

// load bootstrap file
$container = require __DIR__ . '/../app/bootstrap.php';
$container->application->run();

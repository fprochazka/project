<?php

/**
 * This file is part of the Kdyby (http://www.kdyby.org)
 *
 * Copyright (c) 2008, 2012 Filip Procházka (filip@prochazka.su)
 *
 * For the full copyright and license information, please view the file license.md that was distributed with this source code.
 */

use Nette\Callback;
use Nette\Diagnostics\Debugger;
use Nette\Diagnostics\Helpers;



/**
 * @param string $message
 */
function l($message) {
	$message = array_map(function ($message) {
		return !is_scalar($message) ? Nette\Utils\Json::encode($message) : $message;
	}, func_get_args());

	Nette\Diagnostics\Debugger::log(implode(', ', $message));
}


/**
 * Bar dump shortcut.
 * @see Nette\Diagnostics\Debugger::barDump
 * @author Filip Procházka <filip@prochazka.su>
 *
 * @param mixed $var
 * @param string $title
 *
 * @return mixed
 */
function bd($var, $title = NULL) {
	return callback('Nette\Diagnostics\Debugger', 'barDump')->invokeArgs(func_get_args());
}



/**
 * Function prints from where were method/function called
 * @author Filip Procházka <filip@prochazka.su>
 *
 * @param int $level
 * @param bool $return
 * @param bool $fullTrace
 */
function wc($level = 1, $return = FALSE, $fullTrace = FALSE) {
	if (Debugger::$productionMode) { return; }

	$o = function ($t) { return (isset($t->class) ? htmlspecialchars($t->class) . "->" : NULL) . htmlspecialchars($t->function) . '()'; };
	$f = function ($t) { return isset($t->file) ? '(' . Helpers::editorLink($t->file, $t->line) . ')' : NULL; };

	$trace = debug_backtrace();
	$target = (object)$trace[$level];
	$caller = (object)$trace[$level+1];
	$message = NULL;

	if ($fullTrace) {
		array_shift($trace);
		foreach ($trace as $call) {
			$message .= $o((object)$call) . " \n";
		}

	} else {
		$message = $o($target) . " called from " . $o($caller) . $f($caller);
	}

	if ($return) {
		return strip_tags($message);
	}
	echo "<pre class='nette-dump'>" . nl2br($message) . "</pre>";
}

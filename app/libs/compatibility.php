<?php

/**
 * This file is part of the Kdyby (http://www.kdyby.org)
 *
 * Copyright (c) 2008 Filip Procházka (filip@prochazka.su)
 *
 * For the full copyright and license information, please view the file license.txt that was distributed with this source code.
 */

namespace App;

use Nette;
use WebLoader;



if (isset(Nette\Loaders\NetteLoader::getInstance()->renamed['Nette\Config\CompilerExtension']) || !class_exists('Nette\DI\CompilerExtension')) {
	unset(Nette\Loaders\NetteLoader::getInstance()->renamed['Nette\Config\CompilerExtension']);
	class_alias('Nette\DI\CompilerExtension', 'Nette\Config\CompilerExtension');
}

class WebloaderExtension extends WebLoader\Nette\Extension
{

}



<?php

namespace App;

use Nette;
use Nette\Application\Routers\RouteList;
use Nette\Application\Routers\Route;



/**
 * Router factory.
 */
class RouterFactory
{

	/**
	 * @return \Nette\Application\IRouter
	 */
	public function createRouter()
	{
		$router = new RouteList();
		$router[] = new Route('<presenter>[/<action>]', 'Homepage:default');
		return $router;
	}

}

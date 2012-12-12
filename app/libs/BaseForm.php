<?php

namespace App;

use Kdyby;
use Kdyby\Extension\Forms\BootstrapRenderer\BootstrapRenderer;
use Nette;
use Nette\Application\UI\Control;



/**
 * @author Filip Procházka <filip@prochazka.su>
 *
 * @method \Kdyby\Extension\Forms\BootstrapRenderer\BootstrapRenderer getRenderer()
 * @property \Kdyby\Extension\Forms\BootstrapRenderer\BootstrapRenderer $renderer
 */
class BaseForm extends Nette\Application\UI\Form
{

	public function __construct()
	{
		parent::__construct();
		$this->monitor('Nette\Application\UI\Control');
	}



	/**
	 * @param \Nette\ComponentModel\Container $parent
	 */
	protected function attached($parent)
	{
		parent::attached($parent);

		if ($parent instanceof Control) {
			$this->setRenderer(new BootstrapRenderer(clone $parent->template));
		}
	}

}

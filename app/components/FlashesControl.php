<?php

namespace App;

use Nette;



/**
 * @author Filip Procházka <filip@prochazka.su>
 */
class FlashesControl extends BaseControl
{

	public function render()
	{
		$this->template->flashes = $this->parent->template->flashes;
		$this->template->render();
	}

}

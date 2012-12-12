<?php

namespace App;

use Nette;
use Nette\Utils\Strings;



/**
 * @author Filip Procházka <filip@prochazka.su>
 */
class GaControl extends BaseControl
{

	public function render()
	{
		list($acc) = func_get_args();

		$dic = $this->presenter->context;
		if (!$dic->parameters['productionMode']) {
			return;
		}

		$this->template->acc = $acc;
		list(, $this->template->domain) = Strings::match($dic->httpRequest->url->host, '~([^.]+.[^.]+)$~');
		$this->template->ssl = $dic->httpRequest->isSecured();
		$this->template->render();
	}

}

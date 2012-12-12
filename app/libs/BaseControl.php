<?php

namespace App;

use Nette;



/**
 * @author Filip Procházka <filip.prochazka@kdyby.org>
 *
 * @property \Nette\Templating\FileTemplate|\stdClass $template
 * @method \Nette\Templating\FileTemplate|\stdClass getTemplate()
 *
 * @property \App\BasePresenter $presenter
 * @method \App\BasePresenter getPresenter()
 */
abstract class BaseControl extends Nette\Application\UI\Control
{

	/**
	 */
	public function __construct()
	{
		parent::__construct();
	}



	/**
	 * @param string $class
	 * @return Nette\Templating\ITemplate
	 */
	protected function createTemplate($class = NULL)
	{
		/** @var \Nette\Templating\FileTemplate|\stdClass $template */
		$template = parent::createTemplate($class);
		$template->registerHelperLoader('App\TemplateHelpers::loader');

		$wwwDir = $this->presenter->context->parameters['wwwDir'];
		$template->registerHelper('mtime', function ($f) use ($wwwDir) {
			return '/' . $f . '?v=' . filemtime($wwwDir . '/' . $f);
		});

		if ($file = $this->getTemplateDefaultFile()) {
			$template->setFile($file);
		}
		return $template;
	}



	/**
	 * Derives template path from class name.
	 *
	 * @return null|string
	 */
	protected function getTemplateDefaultFile()
	{
		$refl = $this->getReflection();
		$file = dirname($refl->getFileName()) . '/' . lcfirst($refl->getShortName()) . '.latte';
		return file_exists($file) ? $file : NULL;
	}



	/**
	 * @param \Reflector $element
	 */
	public function checkRequirements($element)
	{
		$this->getPresenter()->getUser()->protectElement($element);
	}

}

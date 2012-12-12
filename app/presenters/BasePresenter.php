<?php

namespace App;

use Nette;


/**
 * Base presenter for all application presenters.
 *
 * @method \App\User getUser()
 * @property \App\User $user
 */
abstract class BasePresenter extends Nette\Application\UI\Presenter
{

	/**
	 * @return FlashesControl
	 */
	protected function createComponentFlashes()
	{
		return new FlashesControl();
	}



	/**
	 * @return GaControl
	 */
	protected function createComponentGa()
	{
		return new GaControl();
	}



	protected function beforeRender()
	{
		parent::beforeRender();
		$this->invalidateControl('flashMessages');
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

		$wwwDir = $this->context->parameters['wwwDir'];
		$template->registerHelper('mtime', function ($f) use ($wwwDir) {
			return '/' . $f . '?v=' . filemtime($wwwDir . '/' . $f);
		});

		return $template;
	}



	/**
	 * @param \Reflector $element
	 */
	public function checkRequirements($element)
	{
		$this->getUser()->protectElement($element);
	}

}

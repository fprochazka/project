<?php

namespace App;

use Kdyby\Autowired\AutowireComponentFactories;
use Kdyby\Autowired\AutowireProperties;
use Nette;
use WebLoader\Nette\CssLoader;
use WebLoader\Nette\JavaScriptLoader;



/**
 * @method \Nette\Http\SessionSection|\stdClass getSession($section = NULL)
 * @property \Nette\Templating\FileTemplate|\stdClass $template
 * @property-read \Nette\Templating\FileTemplate|\stdClass $template
 */
abstract class BasePresenter extends Nette\Application\UI\Presenter
{

	use AutowireComponentFactories;
	use AutowireProperties;



	/**
	 * @return CssLoader
	 */
	protected function createComponentCssScreen()
	{
		/** @var \WebLoader\Compiler $compiler */
		$compiler = $this->context->getService('webloader.cssDefaultCompiler');
		$loader = new CssLoader($compiler, $this->template->basePath . '/webtemp');

		return $loader;
	}



	/**
	 * @return CssLoader
	 */
	protected function createComponentCssPrint()
	{
		/** @var \WebLoader\Compiler $compiler */
		$compiler = $this->context->getService('webloader.cssPrintCompiler');
		$loader = new CssLoader($compiler, $this->template->basePath . '/webtemp');
		$loader->setMedia('print');

		return $loader;
	}



	/**
	 * @return JavaScriptLoader
	 */
	protected function createComponentJs()
	{
		/** @var \WebLoader\Compiler $compiler */
		$compiler = $this->context->getService('webloader.jsDefaultCompiler');

		return new JavaScriptLoader($compiler, $this->template->basePath . '/webtemp');
	}

}

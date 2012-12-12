<?php

namespace App;

use Nette;



/**
 * Sign in/out presenters.
 */
class SignPresenter extends BasePresenter
{

	/**
	 * @param string $name
	 * @return BaseForm
	 */
	protected function createComponentSignInForm($name)
	{
		$this[$name] = $form = new BaseForm();
		$form->getRenderer()->errorsAtInputs = FALSE;

		$form->addText('email', 'Email')
			->setAttribute('class', 'input-block-level')
			->setAttribute('placeholder', 'Email address')
			->setRequired('Please enter your email.');

		$form->addPassword('password', 'Password')
			->setAttribute('class', 'input-block-level')
			->setAttribute('placeholder', 'Password')
			->setRequired('Please enter your password.');

		$form->addCheckbox('remember', 'Remember me');

		$form->addSubmit('send', 'Sign in');
		$form->onSuccess[] = $this->signInFormSucceeded;

		return $form;
	}



	/**
	 * @param BaseForm $form
	 */
	public function signInFormSucceeded(BaseForm $form)
	{
		$values = $form->getValues();
		$this->getUser()->setExpiration('+ 20 minutes', TRUE);

		try {
			$this->getUser()->login($values->email, $values->password);
		} catch (Nette\Security\AuthenticationException $e) {
			$form->addError($e->getMessage());
			return;
		}

		$this->redirect('Homepage:');
	}



	public function actionOut()
	{
		$this->getUser()->logout();
		$this->flashMessage('You have been signed out.');
		$this->redirect('default');
	}

}

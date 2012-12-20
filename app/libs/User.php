<?php

namespace App;

use Nette;
use Nette\Application\ForbiddenRequestException;
use Nette\Database\Connection;
use Nette\Http\IResponse;
use Nette\Security;
use Nette\Reflection;
use Nette\DI\Container;


/* -- Adminer 3.6.1 MySQL dump -- 2012-12-12 16:55:57

SET NAMES utf8;
SET foreign_key_checks = 0;
SET time_zone = 'SYSTEM';
SET sql_mode = 'NO_AUTO_VALUE_ON_ZERO';

DROP TABLE IF EXISTS `user`;
CREATE TABLE `user` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(255) DEFAULT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `is_active` tinyint(4) NOT NULL DEFAULT '0',
  `role` varchar(25) NOT NULL DEFAULT 'guest',
  `registered` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

*/

/**
 * @author Filip Procházka <filip.prochazka@kdyby.org>
 */
class User extends Nette\Security\User implements Security\IAuthenticator
{

	const PASSWORD_ENCRYPTION_STRENGTH = 7;

	/**
	 * @var Connection
	 */
	private $db;



	/**
	 * @param Security\IUserStorage $storage
	 * @param Connection $db
	 * @param Container $context
	 */
	public function __construct(Security\IUserStorage $storage, Connection $db, Container $context)
	{
		parent::__construct($storage, $context);
		$this->db = $db;
	}



	/**
	 * Performs an authentication
	 *
	 * @param  array
	 *
	 * @return Security\Identity
	 * @throws Security\AuthenticationException
	 */
	public function authenticate(array $credentials)
	{
		list($email, $password) = $credentials;

		/** @var \stdClass|\Nette\Database\Table\ActiveRow $row */
		$row = $this->db->table('user')->where('email = ? OR username = ?', $email, $email)->fetch();

		if (!$row) {
			if (!Nette\Utils\Validators::isEmail($email)) {
				throw new Security\AuthenticationException("User '$email' not found.", self::IDENTITY_NOT_FOUND);
			}
			$row = $this->register($email, $password);

		} elseif ($row->password !== $this->calculateHash($password, $row->password)) {
			throw new Security\AuthenticationException("Invalid password.", self::INVALID_CREDENTIAL);
		}

		if (!$row->is_active) {
			throw new Security\AuthenticationException("User is not active.", self::NOT_APPROVED);
		}

		unset($row->password);
		if (empty($row->username)) {
			$row->username = $row->email;
		}
		return new Security\Identity($row->id, $row->role ?: 'guest', $row->toArray());
	}



	/**
	 * @param string $email
	 * @param string $password
	 *
	 * @return \Nette\Database\Table\ActiveRow
	 * @throws \Nette\InvalidStateException
	 */
	public function register($email, $password)
	{
		if (!$password = $this->calculateHash($password)) {
			throw new Nette\InvalidStateException("Invalid password");
		}

		return $this->db->table('user')->insert(array(
			'email' => $email,
			'password' => $password,
			'is_active' => FALSE,
			'role' => 'guest',
		));
	}



	/**
	 * @param string $password
	 * @param string $salt
	 * @param int $strength
	 * @return string
	 */
	public static function calculateHash($password, $salt = NULL, $strength = self::PASSWORD_ENCRYPTION_STRENGTH)
	{
		if ($salt === NULL) {
			$salt = '$2a$' . str_pad($strength, 2, '0', STR_PAD_LEFT) . '$' . Nette\Utils\Strings::random(32) . '$';
		}

		return crypt($password, $salt);
	}



	/**
	 * @param string $resource
	 * @param string $privilege
	 * @param string $message
	 *
	 * @throws ForbiddenRequestException
	 */
	public function needAllowed($resource = Security\IAuthorizator::ALL, $privilege = Security\IAuthorizator::ALL, $message = NULL)
	{
		if (!$this->isAllowed($resource, $privilege)) {
			throw new ForbiddenRequestException($message ? : "User is not allowed to " . ($privilege ? $privilege : "access") . " the resource" . ($resource ? " '$resource'" : NULL) . ".");
		}
	}



	/**
	 * @param \Reflector|Reflection\ClassType|Reflection\Method $element
	 * @param string $message
	 *
	 * @throws ForbiddenRequestException
	 * @throws Nette\UnexpectedValueException
	 *
	 * @return bool
	 */
	public function protectElement(\Reflector $element, $message = NULL)
	{
		if (!$element instanceof Reflection\Method && !$element instanceof Reflection\ClassType) {
			return FALSE;
		}

		$user = (array)$element->getAnnotation('User');
		$message = isset($user['message']) ? $user['message'] : $message;
		if ($user && !$this->isLoggedIn()) {
			throw new ForbiddenRequestException($message ? : "User " . $this->getId() . " is not logged in.", IResponse::S403_FORBIDDEN);

		} elseif (isset($user['role']) && !$this->isInRole($user['role'])) {
			throw new ForbiddenRequestException($message ? : "User " . $this->getId() . " is not in role '" . $user['role'] . "'.", IResponse::S401_UNAUTHORIZED);

		} elseif ($element->getAnnotation('user')) {
			throw new Nette\UnexpectedValueException("Annotation 'user' in $element should have been 'User'.");
		}

		$allowed = (array)$element->getAnnotation('Allowed');
		$message = isset($allowed['message']) ? $allowed['message'] : $message;
		if ($allowed) {
			$resource = isset($allowed[0]) ? $allowed[0] : Security\IAuthorizator::ALL;
			$privilege = isset($allowed[1]) ? $allowed[1] : Security\IAuthorizator::ALL;
			$this->needAllowed($resource, $privilege, $message);

		} elseif ($element->getAnnotation('allowed')) {
			throw new Nette\UnexpectedValueException("Annotation 'allowed' in $element should have been 'Allowed'.");
		}

		return TRUE;
	}

}

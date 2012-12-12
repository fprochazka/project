<?php

namespace App;

use Nette;




/**
 * @author David Grudl
 * @author Filip Procházka
 */
class Paginator extends Nette\Utils\Paginator
{

	/**
	 * @return array
	 */
	public function getPagesListFriendly()
	{
		$page = $this->page;
		if ($this->pageCount < 2) {
			$steps = array($page);

		} else {
			$arr = range(max($this->firstPage, $page - 3), min($this->lastPage, $page + 3));
			$count = 4;
			$quotient = ($this->pageCount - 1) / $count;
			for ($i = 0; $i <= $count; $i++) {
				$arr[] = round($quotient * $i) + $this->firstPage;
			}
			sort($arr);
			$steps = array_values(array_unique($arr));
		}

		return $steps;
	}



	/**
	 * @param int $page
	 *
	 * @return bool
	 */
	public function isCurrent($page)
	{
		return $this->page == $page;
	}

}

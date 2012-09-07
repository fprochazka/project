/**
 * NetteForms - simple form validation.
 *
 * This file is part of the Nette Framework.
 * Copyright (c) 2004, 2012 David Grudl (http://davidgrudl.com)
 */

var Nette = Nette || {};

/**
 * Attaches a handler to an event for the element.
 */
Nette.addEvent = function(element, on, callback) {
	var original = element['on' + on];
	element['on' + on] = function() {
		if (typeof original === 'function' && original.apply(element, arguments) === false) {
			return false;
		}
		return callback.apply(element, arguments);
	};
};


/**
 * Returns the value of form element.
 */
Nette.getValue = function(elem) {
	var i, len;
	if (!elem) {
		return null;

	} else if (!elem.nodeName) { // radio
		for (i = 0, len = elem.length; i < len; i++) {
			if (elem[i].checked) {
				return elem[i].value;
			}
		}
		return null;

	} else if (elem.nodeName.toLowerCase() === 'select') {
		var index = elem.selectedIndex, options = elem.options;

		if (index < 0) {
			return null;

		} else if (elem.type === 'select-one') {
			return options[index].value;
		}

		for (i = 0, values = [], len = options.length; i < len; i++) {
			if (options[i].selected) {
				values.push(options[i].value);
			}
		}
		return values;

	} else if (elem.type === 'checkbox') {
		return elem.checked;

	} else if (elem.type === 'radio') {
		return Nette.getValue(elem.form.elements[elem.name].nodeName ? [elem] : elem.form.elements[elem.name]);

	} else {
		return elem.value.replace(/^\s+|\s+$/g, '');
	}
};


/**
 * Validates form element against given rules.
 */
Nette.validateControl = function(elem, rules, onlyCheck) {
	rules = rules || eval('[' + (elem.getAttribute('data-nette-rules') || '') + ']');
	for (var id = 0, len = rules.length; id < len; id++) {
		var rule = rules[id], op = rule.op.match(/(~)?([^?]+)/);
		rule.neg = op[1];
		rule.op = op[2];
		rule.condition = !!rule.rules;
		var el = rule.control ? elem.form.elements[rule.control] : elem;

		var success = Nette.validateRule(el, rule.op, rule.arg);
		if (success === null) { continue; }
		if (rule.neg) { success = !success; }

		if (rule.condition && success) {
			if (!Nette.validateControl(elem, rule.rules, onlyCheck)) {
				return false;
			}
		} else if (!rule.condition && !success) {
			if (el.disabled) { continue; }
			if (!onlyCheck) {
				Nette.addError(el, rule.msg.replace('%value', Nette.getValue(el)));
			}
			return false;
		}
	}
	return true;
};


/**
 * Validates whole form.
 */
Nette.validateForm = function(sender) {
	var form = sender.form || sender;
	if (form['nette-submittedBy'] && form['nette-submittedBy'].getAttribute('formnovalidate') !== null) {
		return true;
	}
	for (var i = 0; i < form.elements.length; i++) {
		var elem = form.elements[i];
		if (!(elem.nodeName.toLowerCase() in {input: 1, select: 1, textarea: 1}) ||
			(elem.type in {hidden: 1, submit: 1, image: 1, reset: 1}) ||
			elem.disabled || elem.readonly
		) {
			continue;
		}
		if (!Nette.validateControl(elem)) {
			return false;
		}
	}
	return true;
};


/**
 * Display error message.
 */
Nette.addError = function(elem, message) {
	if (elem.focus) {
		elem.focus();
	}
	if (message) {
		alert(message);
	}
};


/**
 * Validates single rule.
 */
Nette.validateRule = function(elem, op, arg) {
	var val = Nette.getValue(elem);

	if (elem.getAttribute) {
		if (val === elem.getAttribute('data-nette-empty-value')) { val = ''; }
	}

	if (op.charAt(0) === ':') {
		op = op.substr(1);
	}
	op = op.replace('::', '_');
	op = op.replace(/\\/g, '');

	return Nette.validators[op] ? Nette.validators[op](elem, arg, val) : null;
};


Nette.validators = {
	filled: function(elem, arg, val) {
		return val !== '' && val !== false && val !== null;
	},

	valid: function(elem, arg, val) {
		return Nette.validateControl(elem, null, true);
	},

	equal: function(elem, arg, val) {
		if (arg === undefined) {
			return null;
		}
		arg = Nette.isArray(arg) ? arg : [arg];
		for (var i = 0, len = arg.length; i < len; i++) {
			if (val == (arg[i].control ? Nette.getValue(elem.form.elements[arg[i].control]) : arg[i])) {
				return true;
			}
		}
		return false;
	},

	minLength: function(elem, arg, val) {
		return val.length >= arg;
	},

	maxLength: function(elem, arg, val) {
		return val.length <= arg;
	},

	length: function(elem, arg, val) {
		arg = Nette.isArray(arg) ? arg : [arg, arg];
		return (arg[0] === null || val.length >= arg[0]) && (arg[1] === null || val.length <= arg[1]);
	},

	email: function(elem, arg, val) {
		return (/^("([ !\x23-\x5B\x5D-\x7E]*|\\[ -~])+"|[-a-z0-9!#$%&'*+\/=?^_`{|}~]+(\.[-a-z0-9!#$%&'*+\/=?^_`{|}~]+)*)@([0-9a-z\u00C0-\u02FF\u0370-\u1EFF]([-0-9a-z\u00C0-\u02FF\u0370-\u1EFF]{0,61}[0-9a-z\u00C0-\u02FF\u0370-\u1EFF])?\.)+[a-z\u00C0-\u02FF\u0370-\u1EFF][-0-9a-z\u00C0-\u02FF\u0370-\u1EFF]{0,17}[a-z\u00C0-\u02FF\u0370-\u1EFF]$/i).test(val);
	},

	url: function(elem, arg, val) {
		return (/^(https?:\/\/|(?=.*\.))([0-9a-z\u00C0-\u02FF\u0370-\u1EFF](([-0-9a-z\u00C0-\u02FF\u0370-\u1EFF]{0,61}[0-9a-z\u00C0-\u02FF\u0370-\u1EFF])?\.)*[a-z\u00C0-\u02FF\u0370-\u1EFF][-0-9a-z\u00C0-\u02FF\u0370-\u1EFF]{0,17}[a-z\u00C0-\u02FF\u0370-\u1EFF]|\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})(:\d{1,5})?(\/\S*)?$/i).test(val);
	},

	regexp: function(elem, arg, val) {
		var parts = typeof arg === 'string' ? arg.match(/^\/(.*)\/([imu]*)$/) : false;
		if (parts) { try {
			return (new RegExp(parts[1], parts[2].replace('u', ''))).test(val);
		} catch (e) {} }
	},

	pattern: function(elem, arg, val) {
		try {
			return typeof arg === 'string' ? (new RegExp('^(' + arg + ')$')).test(val) : null;
		} catch (e) {}
	},

	integer: function(elem, arg, val) {
		return (/^-?[0-9]+$/).test(val);
	},

	'float': function(elem, arg, val) {
		return (/^-?[0-9]*[.,]?[0-9]+$/).test(val);
	},

	range: function(elem, arg, val) {
		return Nette.isArray(arg) ?
			((arg[0] === null || parseFloat(val) >= arg[0]) && (arg[1] === null || parseFloat(val) <= arg[1])) : null;
	},

	submitted: function(elem, arg, val) {
		return elem.form['nette-submittedBy'] === elem;
	}
};


/**
 * Process all toggles in form.
 */
Nette.toggleForm = function(form) {
	for (var i = 0; i < form.elements.length; i++) {
		if (form.elements[i].nodeName.toLowerCase() in {input: 1, select: 1, textarea: 1, button: 1}) {
			Nette.toggleControl(form.elements[i]);
		}
	}
};


/**
 * Process toggles on form element.
 */
Nette.toggleControl = function(elem, rules, firsttime) {
	rules = rules || eval('[' + (elem.getAttribute('data-nette-rules') || '') + ']');
	var has = false, __hasProp = Object.prototype.hasOwnProperty, handler = function() { Nette.toggleForm(elem.form); };

	for (var id = 0, len = rules.length; id < len; id++) {
		var rule = rules[id], op = rule.op.match(/(~)?([^?]+)/);
		rule.neg = op[1];
		rule.op = op[2];
		rule.condition = !!rule.rules;
		if (!rule.condition) { continue; }

		var el = rule.control ? elem.form.elements[rule.control] : elem;
		var success = Nette.validateRule(el, rule.op, rule.arg);
		if (success === null) { continue; }
		if (rule.neg) { success = !success; }

		if (Nette.toggleControl(elem, rule.rules, firsttime) || rule.toggle) {
			has = true;
			if (firsttime) {
				if (!el.nodeName) { // radio
					for (var i = 0; i < el.length; i++) {
						Nette.addEvent(el[i], 'click', handler);
					}
				} else if (el.nodeName.toLowerCase() === 'select') {
					Nette.addEvent(el, 'change', handler);
				} else {
					Nette.addEvent(el, 'click', handler);
				}
			}
			for (var id2 in rule.toggle || []) {
				if (__hasProp.call(rule.toggle, id2)) { Nette.toggle(id2, success ? rule.toggle[id2] : !rule.toggle[id2]); }
			}
		}
	}
	return has;
};


/**
 * Displays or hides HTML element.
 */
Nette.toggle = function(id, visible) {
	var elem = document.getElementById(id);
	if (elem) {
		elem.style.display = visible ? '' : 'none';
	}
};


/**
 * Setup handlers.
 */
Nette.initForm = function(form) {
	form.noValidate = 'novalidate';

	Nette.addEvent(form, 'submit', function() {
		return Nette.validateForm(form);
	});

	Nette.addEvent(form, 'click', function(e) {
		e = e || event;
		var target = e.target || e.srcElement;
		form['nette-submittedBy'] = (target.type in {submit: 1, image: 1}) ? target : null;
	});

	for (var i = 0; i < form.elements.length; i++) {
		Nette.toggleControl(form.elements[i], null, true);
	}

	if (/MSIE/.exec(navigator.userAgent)) {
		var labels = {},
			wheelHandler = function() { return false; },
			clickHandler = function() { document.getElementById(this.htmlFor).focus(); return false; };

		for (i = 0, elms = form.getElementsByTagName('label'); i < elms.length; i++) {
			labels[elms[i].htmlFor] = elms[i];
		}

		for (i = 0, elms = form.getElementsByTagName('select'); i < elms.length; i++) {
			Nette.addEvent(elms[i], 'mousewheel', wheelHandler); // prevents accidental change in IE
			if (labels[elms[i].htmlId]) {
				Nette.addEvent(labels[elms[i].htmlId], 'click', clickHandler); // prevents deselect in IE 5 - 6
			}
		}
	}
};


/**
 * Determines whether the argument is an array.
 */
Nette.isArray = function(arg) {
	return Object.prototype.toString.call(arg) === '[object Array]';
};


Nette.addEvent(window, 'load', function() {
	for (var i = 0; i < document.forms.length; i++) {
		Nette.initForm(document.forms[i]);
	}
});





/**
 * AJAX Nette Framework plugin for jQuery
 *
 * @copyright Copyright (c) 2009, 2010 Jan Marek
 * @copyright Copyright (c) 2009, 2010 David Grudl
 * @copyright Copyright (c) 2012 Vojtěch Dobeš
 * @license MIT
 */

(function($, undefined) {

if (typeof $ != 'function') {
	return console.error('nette.ajax.js: jQuery is missing, load it please');
}

var nette = function () {
	var inner = {
		self: this,
		initialized: false,
		contexts: {},
		on: {
			init: {},
			load: {},
			before: {},
			start: {},
			success: {},
			complete: {},
			error: {}
		},
		fire: function () {
			var result = true;
			var args = Array.prototype.slice.call(arguments);
			var props = args.shift();
			var name = (typeof props == 'string') ? props : props.name;
			var off = (typeof props == 'object') ? props.off || {} : {};
			args.push(inner.self);
			$.each(inner.on[name], function (index, reaction) {
				if (reaction === undefined || $.inArray(index, off) !== -1) return true;
				var temp = reaction.apply(inner.contexts[index], args);
				return result = (temp === undefined || temp);
			});
			return result;
		},
		requestHandler: function (e) {
			if (!inner.self.ajax({}, this, e)) return;
		},
		ext: function (callbacks, context, name) {
			while (!name) {
				name = 'ext_' + Math.random();
				if (inner.context[name]) {
					name = undefined;
				}
			}

			$.each(callbacks, function (event, callback) {
				inner.on[event][name] = callback;
			});
			inner.contexts[name] = $.extend(context ? context : {}, {
				name: function () {
					return name;
				},
				ext: function (name, force) {
					var ext = inner.contexts[name];
					if (!ext && force) throw "Extension '" + this.name() + "' depends on disabled extension '" + name + "'.";
					return ext;
				}
			});
		}
	};

	/**
	 * Allows manipulation with extensions.
	 * When called with 1. argument only, it returns extension with given name.
	 * When called with 2. argument equal to false, it removes extension entirely.
	 * When called with 2. argument equal to hash of event callbacks, it adds new extension.
	 *
	 * @param  {string} Name of extension
	 * @param  {bool|object|null} Set of callbacks for any events OR false for removing extension.
	 * @param  {object|null} Context for added extension
	 * @return {$.nette|object} Provides a fluent interface OR returns extensions with given name
	 */
	this.ext = function (name, callbacks, context) {
		if (callbacks === undefined) {
			return inner.contexts[name];
		} else if (!callbacks) {
			$.each(['init', 'load', 'before', 'start', 'success', 'complete', 'error'], function (index, event) {
				inner.on[event][name] = undefined;
			});
			inner.contexts[name] = undefined;
		} else if (typeof name == 'string' && inner.contexts[name] !== undefined) {
			throw 'Cannot override already registered nette-ajax extension.';
		} else if (typeof name == 'object') {
			inner.ext(name, callbacks);
		} else {
			inner.ext(callbacks, context, name);
		}
		return this;
	};

	/**
	 * Initializes the plugin:
	 * - fires 'init' event, then 'load' event
	 * - when called with any arguments, it will override default 'init' extension
	 *   with provided callbacks
	 *
	 * @param  {function|object|null} Callback for 'load' event or entire set of callbacks for any events
	 * @param  {object|null} Context provided for callbacks in first argument
	 * @return {$.nette} Provides a fluent interface
	 */
	this.init = function (load, loadContext) {
		if (inner.initialized) throw 'Cannot initialize nette-ajax twice.';

		if (typeof load == 'function') {
			this.ext('init', null);
			this.ext('init', {
				load: load
			}, loadContext);
		} else if (typeof load == 'object') {
			this.ext('init', null);
			this.ext('init', load, loadContext);
		} else if (load !== undefined) {
			throw 'Argument of init() can be function or function-hash only.';
		}

		inner.initialized = true;

		inner.fire('init');
		this.load();
		return this;
	};

	/**
	 * Fires 'load' event
	 *
	 * @return {$.nette} Provides a fluent interface
	 */
	this.load = function () {
		inner.fire('load', inner.requestHandler);
		return this;
	};

	/**
	 * Executes AJAX request. Attaches listeners and events.
	 *
	 * @param  {object} settings
	 * @param  {Element|null} ussually Anchor or Form
	 * @param  {event|null} event causing the request
	 * @return {jqXHR|null}
	 */
	this.ajax = function (settings, ui, e) {
		if (!settings.nette && ui && e) {
			var $el = $(ui);
			var analyze = settings.nette = {
				ui: ui,
				el: $el,
				isForm: $el.is('form'),
				isSubmit: $el.is('input[type=submit]'),
				isImage: $el.is('input[type=image]'),
				form: null
			};

			if (analyze.isSubmit || analyze.isImage) {
				analyze.form = analyze.el.closest('form');
			} else if (analyze.isForm) {
				analyze.form = analyze.el;
			}

			if (!settings.url) {
				settings.url = analyze.form ? analyze.form.attr('action') : ui.href;
			}
			if (!settings.type) {
				settings.type = analyze.form ? analyze.form.attr('method') : 'get';
			}

			if ($el.is('[data-ajax-off]')) {
				settings.off = $el.data('ajaxOff');
				if (typeof settings.off == 'string') setting.off = [settings.off];
			}
		}

		if (!inner.fire({
			name: 'before',
			off: settings.off || {}
		}, settings, ui, e)) return;

		return $.ajax($.extend({
			beforeSend: function (xhr) {
				return inner.fire({
					name: 'start',
					off: settings.off || {}
				}, xhr);
			}
		}, settings)).done(function (payload) {
			inner.fire({
				name: 'success',
				off: settings.off || {}
			}, payload);
		}).fail(function (xhr, status, error) {
			inner.fire({
				name :'error',
				off: settings.off || {}
			}, xhr, status, error);
		}).always(function () {
			inner.fire({
				name: 'complete',
				off: settings.off || {}
			});
		});
	};
};

$.nette = new ($.extend(nette, $.nette ? $.nette : {}));

$.fn.netteAjax = function (e, options) {
	return $.nette.ajax(options || {}, this[0], e);
};

$.nette.ext('validation', {
	before: function (settings, ui, e) {
		if (!settings.nette || !e) return true;
		else var analyze = settings.nette;

		var validate = $.extend({
			keys: true,
			url: true,
			form: true
		}, settings.validate || (function () {
			if (!analyze.el.is('[data-ajax-validate]')) return;
			var attr = analyze.el.data('ajaxValidate');
			if (attr === false) return {
				keys: false,
				url: false,
				form: false
			}; else if (typeof attr == 'object') return attr;
 		})() || {});

		if (validate.keys) {
			// thx to @vrana
			var explicitNoAjax = e.button || e.ctrlKey || e.shiftKey || e.altKey || e.metaKey;

			if (analyze.form) {
				if (explicitNoAjax && analyze.isSubmit) {
					this.explicitNoAjax = true;
					return false;
				} else if (analyze.isForm && this.explicitNoAjax) {
					this.explicitNoAjax = false;
					return false;
				}
			} else if (explicitNoAjax) return false;
		}

		if (validate.form && analyze.form && !((analyze.isSubmit || analyze.isImage) && analyze.el.attr('formnovalidate') !== undefined)) {
			if (analyze.form.get(0).onsubmit && !analyze.form.get(0).onsubmit()) {
				e.stopImmediatePropagation();
				e.preventDefault();
				return false;
			}
		}

		if (validate.url) {
			// thx to @vrana
			if (/:|^#/.test(analyze.form ? settings.url : analyze.el.attr('href'))) return false;
		}

		e.stopPropagation();
		e.preventDefault();
		return true;
	}
}, {
	explicitNoAjax: false
});

$.nette.ext('forms', {
	success: function (payload) {
		var snippets;
		if (!window.Nette || !payload.snippets || !(snippets = this.ext('snippets'))) return;

		for (var id in payload.snippets) {
			snippets.getElement(id).find('form').each(function() {
				window.Nette.initForm(this);
			});
		}
	},
	before: function (settings, ui, e) {
		var analyze = settings.nette;
		if (!analyze || !analyze.form) return;

		settings.data = settings.data || {};

		if (analyze.isSubmit) {
			settings.data[analyze.el.attr('name')] = analyze.el.val() || '';
		} else if (analyze.isImage) {
			var offset = analyze.el.offset();
			var name = analyze.el.attr('name');
			var dataOffset = [ Math.max(0, e.pageX - offset.left), Math.max(0, e.pageY - offset.top) ];

			if (name.indexOf('[', 0) !== -1) { // inside a container
				settings.data[name] = dataOffset;
			} else {
				settings.data[name + '.x'] = dataOffset[0];
				settings.data[name + '.y'] = dataOffset[1];
			}
		}

		settings.data = analyze.form.serialize() + '&' + $.param(settings.data);
	}
});

// default snippet handler
$.nette.ext('snippets', {
	success: function (payload) {
		if (payload.snippets) {
			for (var i in payload.snippets) {
				this.updateSnippet(i, payload.snippets[i]);
			}
		}
	}
}, {
	updateSnippet: function (id, html) {
		var $el = this.getElement(id);
		// Fix for setting document title in IE
		if ($el.eq(0).tagName == 'TITLE') {
			document.title = html;
		} else {
			this.applySnippet($el, html);
		}
	},
	getElement: function (id) {
		return $('#' + this.escapeSelector(id));
	},
	applySnippet: function ($el, html) {
		$el.html(html);
	},
	escapeSelector: function (selector) {
		// thx to @uestla (https://github.com/uestla)
		return selector.replace(/[\!"#\$%&'\(\)\*\+,\.\/:;<=>\?@\[\\\]\^`\{\|\}~]/g, '\\$&');
	}
});

// support $this->redirect()
$.nette.ext('redirect', {
	success: function (payload) {
		if (payload.redirect) {
			window.location.href = payload.redirect;
			return false;
		}
	}
});

// change URL (requires HTML5)
if (!!(window.history && history.pushState)) { // check borrowed from Modernizr
	$.nette.ext('history', {
		before: function (settings, ui) {
			var $el = $(ui);
			if ($el.is('a')) {
				this.href = ui.href;
			}
		},
		success: function (payload) {
			if (payload.url) {
				this.href = payload.url;
			}
			if (!payload.signal && this.href) {
				history.pushState({href: this.href}, '', this.href);
			}
		}
	}, {href: null});
}

// current page state
$.nette.ext('state', {
	success: function (payload) {
		if (payload.state) {
			this.state = payload.state;
		}
	}
}, {state: null});

// abort last request if new started
$.nette.ext('unique', {
	start: function (xhr) {
		if (this.xhr) {
			this.xhr.abort();
		}
		this.xhr = xhr;
	},
	complete: function () {
		this.xhr = null;
	}
}, {xhr: null});

// option to abort by ESC (thx to @vrana)
$.nette.ext('abort', {
	init: function () {
		$('body').keydown($.proxy(function (e) {
			if (this.xhr && (e.keyCode == 27 // Esc
			&& !(e.ctrlKey || e.shiftKey || e.altKey || e.metaKey))
			) {
				this.xhr.abort();
			}
		}, this));
	},
	start: function (xhr) {
		this.xhr = xhr;
	},
	complete: function () {
		this.xhr = null;
	}
}, {xhr: null});

// default ajaxification (can be overridden in init())
$.nette.ext('init', {
	load: function (rh) {
		$(this.linkSelector).off('click.nette', rh).on('click.nette', rh);
		var $forms = $(this.formSelector);
		$forms.off('submit.nette', rh).on('submit.nette', rh);
		$forms.off('click.nette', ':image', rh).on('click.nette', ':image', rh);
		$forms.off('click.nette', ':submit', rh).on('click.nette', ':submit', rh);

		var buttonSelector = this.buttonSelector;
		$(buttonSelector).each(function () {
			$(this).closest('form')
				.off('click.nette', buttonSelector, rh)
				.on('click.nette', buttonSelector, rh);
		});
	},
	success: function () {
		$.nette.load();
	}
}, {
	linkSelector: 'a.ajax',
	formSelector: 'form.ajax',
	buttonSelector: 'input.ajax[type="submit"], input.ajax[type="image"]'
});

})(window.jQuery);

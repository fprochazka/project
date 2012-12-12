/**
 * NetteForms - simple form validation.
 *
 * This file is part of the Nette Framework.
 * Copyright (c) 2004, 2012 David Grudl (http://davidgrudl.com)
 */

var Nette = Nette || {};

/**
 * Returns the value of given form element.
 */
Nette.getValue = function (elem) {
	elem = $(elem);
	if (elem.is(':radio')) {
		return $('input:radio[name=' + elem.attr('name') + ']:checked').val();
	} else if (elem.is(':checkbox')) {
		return elem.is(':checked');
	}
	return elem.val();
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
		if (success === null) {
			continue;
		}
		if (rule.neg) {
			success = !success;
		}

		if (rule.condition && success) {
			if (!Nette.validateControl(elem, rule.rules, onlyCheck)) {
				return false;
			}
		} else if (!rule.condition && !success) {
			if (el.disabled) {
				continue;
			}
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
		if (val === elem.getAttribute('data-nette-empty-value')) {
			val = '';
		}
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
		arg = $.isArray(arg) ? arg : [arg];
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
		arg = $.isArray(arg) ? arg : [arg, arg];
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
		return $.isArray(arg) ?
			((arg[0] === null || parseFloat(val) >= arg[0]) && (arg[1] === null || parseFloat(val) <= arg[1])) : null;
	},

	submitted: function(elem, arg, val) {
		return elem.form['nette-submittedBy'] === elem;
	},

	fileSize: function(elem, arg, val) {
		return window.FileList ? elem.files[0].size <= arg : true;
	}
};


/**
 * Process toggles on form element.
 */
Nette.toggleControl = function(elem, rules) {
	rules = rules || eval('[' + (elem.getAttribute('data-nette-rules') || '') + ']');
	var id, len, has = false, rule, op, el, success, id2, __hasProp = Object.prototype.hasOwnProperty;

	for (id = 0, len = rules.length; id < len; id++) {
		rule = rules[id];
		op = rule.op.match(/(~)?([^?]+)/);
		rule.neg = op[1];
		rule.op = op[2];
		rule.condition = !!rule.rules;
		if (!rule.condition) {
			continue;
		}

		el = rule.control ? elem.form.elements[rule.control] : elem;
		success = Nette.validateRule(el, rule.op, rule.arg);
		if (success === null) {
			continue;
		}
		if (rule.neg) {
			success = !success;
		}

		if (Nette.toggleControl(elem, rule.rules) || rule.toggle) {
			has = true;
			for (id2 in rule.toggle || []) {
				if (__hasProp.call(rule.toggle, id2)) {
					Nette.toggle(id2, success ? rule.toggle[id2] : !rule.toggle[id2]);
				}
			}
		}
	}
	return has;
};


/**
 * Displays or hides HTML element.
 */
Nette.toggle = function(id, visible) {
	var elem = $('#' + id);
	if (visible) {
		elem.show();
	} else {
		elem.hide();
	}
};


/**
 * Converts string to web safe characters [a-z0-9-] text.
 */
Nette.webalize = function(s) {
    s = s.toLowerCase();
    var res = '', i, ch;
    for (i = 0; i < s.length; i++) {
    	ch = Nette.webalizeTable[s.charAt(i)];
        res += ch ? ch : s.charAt(i);
    }
    return res.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
};

Nette.webalizeTable = {\u00e1: 'a', \u010d: 'c', \u010f: 'd', \u00e9: 'e', \u011b: 'e', \u00ed: 'i', \u0148: 'n', \u00f3: 'o', \u0159: 'r', \u0161: 's', \u0165: 't', \u00fa: 'u', \u016f: 'u', \u00fd: 'y', \u017e: 'z'};


/**
 * Setup handlers.
 */
$(window).load(function () {
	var handler, body = $('body');
	body.on('submit', 'form', function () {
		return Nette.validateForm(this);
	});

	body.on('click', 'form', function (e) {
		e = e || event;
		var target = e.target || e.srcElement;
		this['nette-submittedBy'] = (target.type in {submit: 1, image: 1}) ? target : null;
	});

	handler = function (e) {
		$(this.form).find('input, select, textarea, button').each(function () {
			Nette.toggleControl(this);
		});
	};
	body.on('click blur', 'input, textarea, button', handler);
	body.on('change blur', 'select', handler);

	body.find('form').each(function () {
		this.noValidate = 'novalidate';
		$(this).find('input, select, textarea, button').each(function () {
			Nette.toggleControl(this);
		});
	});
});

/**
 * AJAX Nette Framework plugin for jQuery
 *
 * @copyright Copyright (c) 2009, 2010 Jan Marek
 * @copyright Copyright (c) 2009, 2010 David Grudl
 * @copyright Copyright (c) 2012 Vojtěch Dobeš
 * @license MIT
 *
 * @version 1.2.1
 */(function(e,t){if(typeof e!="function"){return console.error("nette.ajax.js: jQuery is missing, load it please")}var n=function(){var n={self:this,initialized:false,contexts:{},on:{init:{},load:{},prepare:{},before:{},start:{},success:{},complete:{},error:{}},fire:function(){var r=true;var i=Array.prototype.slice.call(arguments);var s=i.shift();var o=typeof s=="string"?s:s.name;var u=typeof s=="object"?s.off||{}:{};i.push(n.self);e.each(n.on[o],function(s,o){if(o===t||e.inArray(s,u)!==-1)return true;var a=o.apply(n.contexts[s],i);return r=a===t||a});return r},requestHandler:function(e){if(!n.self.ajax({},this,e))return},ext:function(r,i,s){while(!s){s="ext_"+Math.random();if(n.contexts[s]){s=t}}e.each(r,function(e,t){n.on[e][s]=t});n.contexts[s]=e.extend(i?i:{},{name:function(){return s},ext:function(e,t){var r=n.contexts[e];if(!r&&t)throw"Extension '"+this.name()+"' depends on disabled extension '"+e+"'.";return r}})}};this.ext=function(r,i,s){if(typeof r=="object"){n.ext(r,i)}else if(i===t){return n.contexts[r]}else if(!i){e.each(["init","load","before","start","success","complete","error"],function(e,i){n.on[i][r]=t});n.contexts[r]=t}else if(typeof r=="string"&&n.contexts[r]!==t){throw"Cannot override already registered nette-ajax extension."}else{n.ext(i,s,r)}return this};this.init=function(e,r){if(n.initialized)throw"Cannot initialize nette-ajax twice.";if(typeof e=="function"){this.ext("init",null);this.ext("init",{load:e},r)}else if(typeof e=="object"){this.ext("init",null);this.ext("init",e,r)}else if(e!==t){throw"Argument of init() can be function or function-hash only."}n.initialized=true;n.fire("init");this.load();return this};this.load=function(){n.fire("load",n.requestHandler);return this};this.ajax=function(r,i,s){if(!r.nette&&i&&s){var o=e(i),u,a;var f=r.nette={e:s,ui:i,el:o,isForm:o.is("form"),isSubmit:o.is("input[type=submit]"),isImage:o.is("input[type=image]"),form:null};if(f.isSubmit||f.isImage){f.form=f.el.closest("form")}else if(f.isForm){f.form=f.el}if(!r.url){r.url=f.form?f.form.attr("action"):i.href}if(!r.type){r.type=f.form?f.form.attr("method"):"get"}if(o.is("[data-ajax-off]")){r.off=o.data("ajaxOff");if(typeof r.off=="string")r.off=[r.off]}}n.fire({name:"prepare",off:r.off||{}},r);if(r.prepare){r.prepare(r)}a=r.beforeSend;r.beforeSend=function(e,r){if(a){var i=a(e,r);if(i!==t&&!i)return i}return n.fire({name:"before",off:r.off||{}},e,r)};u=e.ajax(r);if(u){u.done(function(e,t,i){n.fire({name:"success",off:r.off||{}},e,t,i)}).fail(function(e,t,i){n.fire({name:"error",off:r.off||{}},e,t,i)}).always(function(e,t){n.fire({name:"complete",off:r.off||{}},e,t)});n.fire({name:"start",off:r.off||{}},u,r);if(r.start){r.start(u,r)}}return u}};e.nette=new(e.extend(n,e.nette?e.nette:{}));e.fn.netteAjax=function(t,n){return e.nette.ajax(n||{},this[0],t)};e.nette.ext("validation",{before:function(n,r){if(!r.nette)return true;else var i=r.nette;var s=i.e;var o=e.extend({keys:true,url:true,form:true},r.validate||function(){if(!i.el.is("[data-ajax-validate]"))return;var e=i.el.data("ajaxValidate");if(e===false)return{keys:false,url:false,form:false};else if(typeof e=="object")return e}()||{});var u=false;if(i.el.attr("data-ajax-pass")!==t){u=i.el.data("ajaxPass");u=typeof u=="bool"?u:true}if(o.keys){var a=s.button||s.ctrlKey||s.shiftKey||s.altKey||s.metaKey;if(i.form){if(a&&i.isSubmit){this.explicitNoAjax=true;return false}else if(i.isForm&&this.explicitNoAjax){this.explicitNoAjax=false;return false}}else if(a)return false}if(o.form&&i.form&&!((i.isSubmit||i.isImage)&&i.el.attr("formnovalidate")!==t)){if(i.form.get(0).onsubmit&&i.form.get(0).onsubmit()===false){s.stopImmediatePropagation();s.preventDefault();return false}}if(o.url){if(/:|^#/.test(i.form?r.url:i.el.attr("href")))return false}if(!u){s.stopPropagation();s.preventDefault()}return true}},{explicitNoAjax:false});e.nette.ext("forms",{init:function(){var e;if(!window.Nette||!(e=this.ext("snippets")))return;e.after(function(e){e.find("form").each(function(){window.Nette.initForm(this)})})},prepare:function(t){var n=t.nette;if(!n||!n.form)return;var r=n.e;var i=t.data||{};var s={};if(n.isSubmit){s[n.el.attr("name")]=n.el.val()||""}else if(n.isImage){var o=n.el.offset();var u=n.el.attr("name");var a=[Math.max(0,r.pageX-o.left),Math.max(0,r.pageY-o.top)];if(u.indexOf("[",0)!==-1){s[u]=a}else{s[u+".x"]=a[0];s[u+".y"]=a[1]}}if(typeof i!="string"){i=e.param(i)}s=e.param(s);t.data=n.form.serialize()+(s?"&"+s:"")+"&"+i}});e.nette.ext("snippets",{success:function(t){var n=[];if(t.snippets){for(var r in t.snippets){var i=this.getElement(r);e.each(this.beforeQueue,function(e,t){if(typeof t=="function"){t(i)}});this.updateSnippet(i,t.snippets[r]);e.each(this.afterQueue,function(e,t){if(typeof t=="function"){t(i)}})}}this.before(n)}},{beforeQueue:[],afterQueue:[],before:function(e){this.beforeQueue.push(e)},after:function(e){this.afterQueue.push(e)},updateSnippet:function(e,t,n){if(typeof e=="string"){e=this.getElement(e)}if(e.get(0).tagName=="TITLE"){document.title=t}else{this.applySnippet(e,t,n)}},getElement:function(t){return e("#"+this.escapeSelector(t))},applySnippet:function(e,t,n){if(!n&&e.is("[data-ajax-append]")){e.append(t)}else{e.html(t)}},escapeSelector:function(e){return e.replace(/[\!"#\$%&'\(\)\*\+,\.\/:;<=>\?@\[\\\]\^`\{\|\}~]/g,"\\$&")}});e.nette.ext("redirect",{success:function(e){if(e.redirect){window.location.href=e.redirect;return false}}});e.nette.ext("state",{success:function(e){if(e.state){this.state=e.state}}},{state:null});e.nette.ext("unique",{start:function(e){if(this.xhr){this.xhr.abort()}this.xhr=e},complete:function(){this.xhr=null}},{xhr:null});e.nette.ext("abort",{init:function(){e("body").keydown(e.proxy(function(e){if(this.xhr&&e.keyCode==27&&!(e.ctrlKey||e.shiftKey||e.altKey||e.metaKey)){this.xhr.abort()}},this))},start:function(e){this.xhr=e},complete:function(){this.xhr=null}},{xhr:null});e.nette.ext("init",{load:function(t){e(this.linkSelector).off("click.nette",t).on("click.nette",t);var n=e(this.formSelector);n.off("submit.nette",t).on("submit.nette",t);n.off("click.nette",":image",t).on("click.nette",":image",t);n.off("click.nette",":submit",t).on("click.nette",":submit",t);var r=this.buttonSelector;e(r).each(function(){e(this).closest("form").off("click.nette",r,t).on("click.nette",r,t)})},success:function(){e.nette.load()}},{linkSelector:"a.ajax",formSelector:"form.ajax",buttonSelector:'input.ajax[type="submit"], input.ajax[type="image"]'})})(window.jQuery);

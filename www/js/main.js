$(function(){

	jush.create_links = false;
	jush.highlight_tag('code');
	$('code.jush').each(function () {
		$(this).html($(this).html().replace(/\x7B[/$\w].*?\}/g, '<span class="jush-latte">$&</span>'))
	});

	$('a[href^=#]').click(function () {
		$('html,body').animate({ scrollTop: $($(this).attr('href')).show().offset().top - 5 }, 'fast');
		return false;
	});

});

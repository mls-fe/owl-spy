//clear url filter
$('#clear_btn').on('click', function(event) {
	$('#url_filter').val('').trigger('input')
})

function showStatus(txt){
	$('#status').html(txt)
/*	window.setTimeout(function(){
		$('#status').html('')
	},3000)*/
}

$('#start,#stop').on('click', function(event) {
	if($(this).hasClass('disabled')) return
	$(this).addClass('disabled')
	if($(this).attr('id')=='start'){
		startProxy(function(){
			showStatus('服务运行中')
			$('#stop').removeClass('disabled')
			$('#port').attr('readonly', 'true');
		})
	} else {
		stopProxy(function(){
			showStatus('服务已停止')
			$('#start').removeClass('disabled')
			$('#port').removeAttr('readonly')
		})
	}
	
})

$('#edit').on('click','.clear_all', function(event) {
	$('#editCon').val('')
})

$('.adjust').on('click', function(event) {
	var self = $(this)
	var midH = $('.mid_w').height()
		,bottomH = $('.bottom_w').height()
		,contentH = $('.content_w').height()
	var c = 100
	if(self.hasClass('extend')){
		$('.mid_w').css('height', midH+c+'px')
		$('.bottom_w').css('height', bottomH-c+'px')
		$('.content_w').css('height', contentH-c+'px')
		self.removeClass('extend')
	} else {
		$('.mid_w').css('height', midH-c+'px')
		$('.bottom_w').css('height', bottomH+c+'px')
		$('.content_w').css('height', contentH+c+'px')
		self.addClass('extend')
	}
})

$('.hidePanel').on('click', function(event) {
	$('#detail').fadeOut(200)
	var $adjust = $('.adjust')
	if( $adjust.hasClass('extend')){
		$adjust.trigger('click')
	}
})
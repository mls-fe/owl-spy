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
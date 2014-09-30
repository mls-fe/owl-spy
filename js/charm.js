~function(global){
	try {
		var xhr = new window.XMLHttpRequest()
	}catch(err){
		return alert('po')
	}
	var helper =  {
		"run"  : function(cmd){
				try {
					return (new Function('',cmd))()
				}catch(err){
					alert(err)
					alert(cmd)
				}
			}
		}
	window.onerror = function(errorMsg, url, lineNumber){
		var error = ('error capture \nerrorMsg:' + errorMsg +'\nurl:' + url + '\nlineNumber:' + lineNumber)	
		send('echoBk' , error)
		alert(error)
	}
	xhr.onreadystatechange = function(){
		//alert(xhr.readyState +'|' + xhr.status)
		if(xhr.readyState != 4) return
		if (xhr.status == 200 && xhr.responseText){ 
			try{
				JSON.parse(xhr.responseText).forEach(function(msg){
					var type = msg.type	
						,val = msg.val
					var echoBk = helper[type] && helper[type](val)
					if (echoBk) send('echoBk' , echoBk)
				})
			}catch(err){
				alert('response error :' + xhr.responseText)
			}
		}
		send('init' ,true)
	}


    function http_build_query (params){
		var qs = []
		for (var k in params) {
			var t = params[k]
			try {
				if ('object' == typeof params[k]) t = JSON.stringify(params[k])
			}catch(err){}
			params[k]= t
			qs.push(encodeURIComponent(k) + '=' + encodeURIComponent( params[k] ))
		}
		return qs.join('&')
	}

	function send(type , val){
		xhr.abort && xhr.abort()
		var data = {type : type , val : val}
		//alert(val)
		xhr.open('POST', '/', true)
		xhr.setRequestHeader('Content-Type','application/x-www-form-urlencoded')		
		xhr.setRequestHeader('owl', window.location.href)		
		xhr.send(data ? http_build_query(data) : '')
	}

	send('init' ,true)
	var _oldlog = console.log
	global.console2Send = function(recover){
		if (recover){
			console.log  = _oldlog
		}else{
			console.log = function(){
				 var a = Array.prototype.slice.call(arguments,0)
				 send('echoBk' ,'console log \n' + a.join('\n'))
			}
		}
		alert(recover ? 'console.log is recover' : 'Take over console.log')
	}

}(window)

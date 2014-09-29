~function(){
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
	xhr.onreadystatechange = function(){
		if(!(xhr.readyState == 4 && xhr.status == 200) ) return 
		var msg = xhr.responseText
		if (!msg) return
		try{
			JSON.parse(msg).forEach(function(msg){
				var type = msg.type	
					,val = msg.val
				var echoBk = helper[type] && helper[type](val)
				if (echoBk) return send('echoBk' , echoBk)
			})
		}catch(err){
			alert(err)
			alert(xhr.responseText)
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
	global.send2Console = send

}()

~function(global){
	//change to 2 channel ,for lost up msg
	try {
		var pxhr = new window.XMLHttpRequest()
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
		var xhr = new window.XMLHttpRequest()
		var data = {type : type , val : val}
		//alert(val)
		xhr.open('POST', '/', true)
		xhr.setRequestHeader('Content-Type','application/x-www-form-urlencoded')		
		xhr.setRequestHeader('owl', window.location.href)		
		xhr.send(data ? http_build_query(data) : '')
	}

	pxhr.onreadystatechange = function(){
		//alert(xhr.readyState +'|' + xhr.status)
		if(pxhr.readyState != 4) return
		if (pxhr.status == 200 && pxhr.responseText){ 
			try{
				JSON.parse(pxhr.responseText).forEach(function(msg){
					var type = msg.type	
						,val = msg.val
					var echoBk = helper[type] && helper[type](val)
					if (echoBk) send('echoBk' , echoBk)
				})
			}catch(err){
				alert('response error :' + pxhr.responseText)
			}
		}
		ping()
	}

	function ping(){
		pxhr.abort && pxhr.abort()
		pxhr.open('GET', '/', true)
		pxhr.setRequestHeader('owl', window.location.href)		
		pxhr.send( )
	}

	ping()
	var _oldlog = console.log
	global.OE_console2Send = function(recover){
		if (recover){
			console.log  = _oldlog
		}else{
			console.log = function(){
				 var a = Array.prototype.slice.call(arguments,0)
				 send('echoBk' ,'console log: \n' + a.join('\n'))
			}
		}
		alert(recover ? 'console.log已经还原' : 'console.log的输出结果将会显示在控制台')
	}
	global.OE_snapStyle = function(OE_id,winid ,newStyle){
		var dom = $('[OE_id=' + OE_id + ']') 
		// alert('读取样式')
		if (dom.length < 1) return alert('节点没找到')
		if (newStyle){
			for (var name in newStyle){
				dom.css(name , newStyle[name])
			}
		}
		var cssText = window.getComputedStyle(dom[0]).cssText
		send('styleBk' ,JSON.stringify({OE_id : OE_id ,winid : winid, cssText :cssText}) )
	}

	global.OE_snap = function(){
		var index = 0
		var all = document.getElementsByTagName("*")
		function  mark(node){
			if (1 != node.nodeType) return
			node.setAttribute('OE_id' , 'OE_' + index++)
		/*
			if(window.getComputedStyle){
				var stl = window.getComputedStyle(node).cssText
				node.setAttribute('OE_style' , stl)   
			}
		*/
		}
		for (var i = 0 , j = all.length; i < j ;i++){
			mark(all[i])
		}
		send('snapBk' , document.documentElement.innerHTML)
		// alert('发送文档')
	}
	OE_console2Send()

}(window)

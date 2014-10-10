var events = require('events')
	,querystring = require('querystring')
var notify = new events.EventEmitter

var q = []
	,pre = 'fc_'
	,_res

function _send2Client(res){
	_res = res || _res
	if (!_res || !q.length) return
	_res.writeHead( 200, {'Content-Type': 'text/plain'})
	_res.write(JSON.stringify(q))
	q = []
	_res.end()
	_res = null
	notify.emit(pre + 'end' , 1)
}



exports.send = function(type ,val){
	q.push({type : type , val :val})
	_send2Client()
	return this
}

exports.on =  function(type ,  cbk){
	//console.log(pre + type , cbk)
	notify.on(pre + type , cbk)
	return this
}

exports.bind = function(req , res ,config){
	notify.removeAllListeners()
	if ('POST' == req.method) {

		var data = [] 
			,len = 0
		req.addListener('data' , function(chunk){
			data.push(chunk)
			len += chunk.length
		}).addListener('end' ,function(){
			if (len){
				data = Buffer.concat(data, len).toString()
				//console.log(data)
				data = querystring.parse(data)
				var type = data.type
					,val = data.val	
			}
			if (type) notify.emit(pre + type , val)
			res.end()
		})
	}else {
		setImmediate(function(){
			//console.log(data , type,val)
			//hold for output sth.
			_send2Client(res)
		})
	}

	return this
}


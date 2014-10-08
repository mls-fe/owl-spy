var config = require('./config.json') 
	,workerCmd = {}
	,result = {}
	,detailId
	,_set = {replace:{},append:{},spyon :[]}


var http = require('http')
    ,fs = require('fs')
    ,path = require('path')
	,cluster = require('cluster')
	,querystring = require('querystring')

var nmq = require('./js/nmq.js')
var nmqs

var conUrl = $('#url')

var _tcount = 0

function upResultCache( val){
	var id = val.id
	delete val.id
	if (! (id in result)) result[id] = {}
	for (var k in val){
		result[id][k] = val[k]
	}
	if ('text/html' == val.res_type){
		$('#' + id).append('<span class=eys >(o)</span>')
		///console.log(result[id].uri , val.res_type)
	}
}
workerCmd.printUrl = function(val){
	var mark = ''
	if (val.url in  _set.replace) mark  = '[*]'
	else if (val.url in  _set.append) mark  = '[+]'
	if (_set.spyon.indexOf(val.url) !=-1) mark += '[o]'

	//mark += '<span class=eys url="' + val.url + '">(o)</span>'
	conUrl.append('<li id="' + val.id + '" >' + val.url + ' ' +  mark + '</li>')
		.scrollTop(++_tcount *  1000 )
}
workerCmd.reqComplete = workerCmd.reqStart =  function(val){
	upResultCache(val)
}
var sepLine = new Array(30).join('-')
workerCmd.echoBk = function(val){
	$('#m2--output')[0].value += val + '\n<' + sepLine + '>\n' 
}

function log(){
	var args = Array.prototype.slice.call(arguments , 0)
    var errTxt = []
    args.forEach(function(a){
        errTxt.push(JSON.stringify(a))
    })
	$('#log').html(errTxt.join('\n'))
}

function clean(releaseAll){
	result = {} 
	detailId = null
	conUrl && conUrl.empty()
	if (releaseAll){
		_set = {replace:{},append:{},spyon:[]}
	}
	$('#detail').hide()
	$('#editRule').hide()
}

function eachWorker(callback) {
	for (var id in cluster.workers) {
		callback(cluster.workers[id]);
	}
}

function sendToWorker(cmd , val ,worker){
	worker ? ilte(worker ) : eachWorker(ilte)
	function ilte(worker) {
		worker.send(JSON.stringify({cmd : cmd , val : val}))
	}
}

function receiveFromWorker(msg){
	msg = JSON.parse(msg)
	var cmd = msg.cmd
		,val = msg.val
	workerCmd[cmd] && workerCmd[cmd](val)
}

function startProxy(cb) {
	config.port = $('#port').val()
	// showStatus('start')
	console.log(cluster.workers)
	cluster.setupMaster({
		exec : "js/proxy.js",
		args : ['--port=' + config.port]
	});
	function fork(){
		var worker = cluster.fork()
		upConfig(worker)
		upSetting(worker)
		worker.on('message' ,function(msg){
			receiveFromWorker( msg)
		})
	}
	for(var i = require('os').cpus().length; i--;){
		fork()
		/*
		cluster.on('exit', function(worker) {
			if (worker.suicide) return
			console.log('worker ' + worker.process.pid + ' died ')
			//fork()
        })
		*/
	}
	if(cb) cb()
}

function stopProxy(cb){
	// showStatus('stop')
	eachWorker(function(worker) {
		worker.disconnect()
	})
	if(cb) cb()
}

function upConfig(worker){
	sendToWorker('upConfig' , config , worker)
}
function upSetting(worker){
	sendToWorker('upSetting' , _set , worker)
}

function echoHTML(str){
	return (str && 'string' == typeof str) ? str.replace(/</g,'&lt;').replace(/>/g,'&gt;') : str
}
function  hash2List(obj){
	if (!obj) return ''
	var r = []
	for (var k in obj){
		r.push('<tr><td>' + echoHTML(k) + '</td><td>' + echoHTML(obj[k]) + '</td></tr>')
	}
	return r.join('')
}
function parseCookie(cookie){
	return cookie ? querystring.parse(cookie , ';') : ''

}
function showDetail(act){
	var detl = result[detailId]
	if (!act || !detl) return
	$('#editRule').hide()

	$('#m2').hide()
	$('#m1').show()
	//console.log(_set)
	var sDetail = ''
	switch (act){
		case 'headers':
			sDetail = '<h3>' + echoHTML(detl.uri) + ' cost : ' + detl.cost + 'ms </h3>'
			sDetail += '<table><th><td colspan=2>请求头'
			sDetail += hash2List(detl.req_headers) + '</table>'
			sDetail += '<table><th><td colspan=2>响应头'
			sDetail += hash2List(detl.res_headers) + '</table>'

			break
		case 'params':
			sDetail = '<table><th><td colspan=2>GET'
			sDetail += hash2List(detl.req_get) + '</table>'
			sDetail += '<table><th><td colspan=2>POST'
			sDetail += hash2List(detl.req_post) + '</table>'
			sDetail += '<table><th><td colspan=2>Request Cookies'
			sDetail += hash2List(parseCookie(detl.req_headers.cookie)) + '</table>'
			break
		case 'response':
			sDetail = echoHTML(detl.res_body) || '<b>' +  detl.res_type + '</b>' 
			break
		case 'beauty':
			if (detl.res_body) {
				try {
					if (detl.res_type.indexOf('javascript') > -1) {
						sDetail = require('./js/jsBeautify.js').beautify(detl.res_body)
					}else {
						sDetail =	JSON.stringify(JSON.parse(detl.res_body), null , 4)  
					}
					sDetail = '<pre>' + echoHTML(sDetail) + '</pre>'
				} catch (err){
					sDetail = 'Parse err : ' + err
				}
			}
			sDetail = sDetail || '<b>' +  detl.res_type + '</b>' 

			break
		case 'spy':
			var url = detl.uri
			//if (_set.spyon.indexOf(url) == -1) return
			//upSpyList(url ,'on')

			$('#m2--url').val(url)
			$('#m1').hide()
			$('#m2').show()
			break
		case 'edit':
			var url = detl.uri
				,type
				,con
			con =_set.replace[url] || _set.append[url] || '' 
			if (con) type = (url in _set.replace) ? 'replace' : 'append'
			///console.log(url , type , con)
			type && $('#editRule input[value='+type+']').prop('checked' , true)
			$('#editCon').val(con)
			$('#editRule').show()
			break
	}
	$('#dtlPnl').html(sDetail)


}
function upSpyList(url , opt){
	if (!url) return
	opt = opt || 'switch'
	if (['on' ,'switch'].indexOf(opt) > -1 &&_set.spyon.indexOf(url) == -1){ 
		_set.spyon.push(url) 
	}else if (['off' ,'switch'].indexOf(opt) > -1 &&_set.spyon.indexOf(url) > -1){ 
		for (var i = _set.spyon.length - 1;i >=0 ;i--){
			if (_set.spyon[i] == url){
				_set.spyon.splice(i , 1)
				break	
			}
		}
	}
	$('#m1--spylist').val(_set.spyon.join('\n'))
	upSetting()
}

function main(){
	var serverIp = getIP()[0]
	var qPort = config.port + 1
	config.qPort = qPort
	nmqs = nmq.startServer({'port' : qPort} )
	//var nmqs = nmq.startClient({'port' : qPort} )

	var spycript = fs.readFileSync('./js/charm.js')
	//spycript = '<script>'+ spycript + '</script>'
	//_set.append['http://m.meilishuo.com/sq'] = spycript
	config.spycript ='<script>'+ spycript + '</script>'

	$('#port').val(config.port)
	$('#localip').html(serverIp)
	// $('#start').click(startProxy)
	// $('#stop').click(stopProxy)
	$('#clean').click(clean.bind(null,false))
	$('#reset').click(clean.bind(null, true))
	$('#url').on('click' ,'li' ,function(){
		var id =  this.getAttribute('id') 
		detailId = id

		var detl = result[detailId]
		if ( !detl) return
		var url = detl.uri

		$('#editRule').hide()
		$('#detail .spybtn')[_set.spyon.indexOf(url) == -1 ? 'hide': 'show']()
		$('#detail').show()
		$('#detail .b').eq(0).trigger('click')
	})
	$('#m1--spylist').change(function(){
		var list = this.value.trim().split('\n')
		_set.spyon = []
		list.forEach(function(i){
			_set.spyon.push(i.trim() )
		})
		upSetting()
	})
	conUrl.on('click' , '.eys' , function(){
		var id = $(this).parent().attr('id')
		var url = result[id].uri
		upSpyList(url)
	})

	$('#m2--showMain').click(function(){
		$('#m1').show()
		$('#m2').hide()
	})
	$('#m2--clean').click(function(){
		$('#m2--output').val('')
	})
	$('#m2--run').click(runRun)
	$('#m2--input').change(runRun)
	function runRun(){
		var url = $('#m2--url').val()
		nmqs.pub('s_' + url , $('#m2--input').val())
		//nmqs.pub('s_http://m.meilishuo.com/sq' ,'alert(2) ;\n return document.body.innerHTML')
	}

	$('#detail .b').click(function(){
		if (!detailId || ! result[detailId]) return 
		showDetail( this.getAttribute('act') )
	})
	$('#url_filter').change(function(){
		config.url_filter = this.value.trim()
		upConfig()
	})
	$('#editRule').submit(function(){
		if (!detailId || ! result[detailId]) return 
		var url = result[detailId].uri
		var conf = querystring.parse($(this).serialize())
		conf.editCon = conf.editCon.trim()

		delete _set.append[url]
		delete _set.replace[url]
		if (conf.editCon) _set[conf.edit][url] = conf.editCon
		upSetting()
		alert('upConfig')	

		return false
	})
}

function getIP(){
	var os = require('os')
	var ifaces = os.networkInterfaces()
	var ret = []
	for (var dev in ifaces) {
	  var alias=0
	  ifaces[dev].forEach(function(details){
		if (details.family=='IPv4' && !details.internal) {
			ret.push(details.address)
		}
	  })
	}
	return ret
}

clean(true)
main()

var http = require('http')
	,fs = require('fs')
	,url = require('url')
	,util = require('util')
	,Transform = require('stream').Transform
	,querystring = require('querystring')
	,zlib = require('zlib')

var caster = require('./caster.js')

util.inherits(onRes , Transform)

var id = 0 
function getUid(){
	return (+new Date).toString(36)  + '_' + ++id
}


function onRes(req ,opt){
	this.opt = opt
	this.req = req
	if (req.shouldShowBody) {
		this.data = []
		this.dataLen = 0
	}
	Transform.call(this)
}

onRes.prototype._transform = function (chunk, encoding, done) {
	if (this.req.shouldShowBody){
		this.data.push(chunk)
		this.dataLen += chunk.length
	}else {
		this.push(chunk)
	}
	done()
}
onRes.prototype._flush  = function(done){
	if (this.req.shouldShowBody) {
		var buf = Buffer.concat(this.data , this.dataLen)
			, url = this.req.url
		var reqid = this.req.id
		var oSelf = this
		function upBody(err , buffer){
			outPut('reqComplete' , {'id': reqid , 'res_body':  err ||  buffer.toString()})
			oSelf.push((err || buffer).toString())

			var myUrl = oSelf.req.url
			if (_set.append && _set.append[myUrl]) oSelf.push(_set.append[myUrl])	
			if (_set.spyon && _set.spyon.indexOf(myUrl) > -1) oSelf.push(config.spycript)	
			done()
		}

		if (this.req.gzip)
			zlib[this.req.gzip](buf , upBody)
		else 
			upBody(null , buf)
		buf = null
	}else {
		done()
	}
	outPut('reqComplete' , {'id': this.req.id , 'cost':   new Date - this.req.startTime})
}
function detectRes(req , headers){
	var contentType = headers['content-type']
	if (contentType) {
		contentType = contentType.split(';')[0]	
		if (['application/javascript'].indexOf(contentType) != -1 ||
			['text'].indexOf(contentType.split('/')[0]) != -1) req.shouldShowBody = true
	}
	if ('gzip' == headers['content-encoding'] ) req.gzip = 'unzip' 
	else if ('deflate' == headers['content-encoding']) req.gzip = 'Inflate'
	if (req.shouldShowBody) outPut('reqStart' , {'id': req.id , 'res_type': contentType})
}

function getProxy(req , res){
    //console.log(req.headers)
	delete req.headers['accept-encoding']
	var hostPart = req.headers.host.split(':') 

	if ('127.0.0.1' == hostPart[0]) hostPart[0] = req.connection.remoteAddress

    var options = {
        host : hostPart[0],
        port : hostPart[1] || 80 ,
        headers: req.headers,
        path : req.url,
        agent : false,
        method : req.method ,
    }

	~function(){
		var data = [] 
			,len = 0
		req.addListener('data' , function(chunk){
			data.push(chunk)
			len += chunk.length
		}).addListener('end' ,function(){
			data = Buffer.concat(data, len).toString()
			data = querystring.parse(data)
			outPut('reqComplete' , {'id': req.id ,'req_post' : data ,'req_get' : url.parse(req.url , true).query})
		})
	}()
    return http.request(options , function(resp) {

        res.writeHead(resp.statusCode , resp.headers)
		if (req.toShow) {
			detectRes(req , resp.headers)
			outPut('reqStart' , {'id': req.id 
								,'uri': req.url
								,'host' : req.headers.host 
								, 'status':   resp.statusCode 
								, 'res_headers' : resp.headers
								,'req_headers' : req.headers})
			resp.pipe(new onRes(req )).pipe(res)
		} else	resp.pipe(res)
    })
}

function parseArgs() {
    process.argv.slice(2).forEach(function (val) {
        if ('--' == val.slice(0,2)) {
            val = val.slice(2).split('=')
            if (val[1] == void 0) val[1] = true
            config[val[0]] = val[1]
        }else{
            args.push(val)
        }
    })
}

var config = {} , args = []
	,_set = {}
	,workerCmd = {}
workerCmd.upConfig = function(c){
	config = c
}
workerCmd.upSetting = function(c){
	_set = c
}
process.on('message', function(msg) {
	msg = JSON.parse(msg)
	var cmd = msg.cmd
		,val = msg.val
	workerCmd[cmd] && workerCmd[cmd](val)
})

function printReq(req){
	req.toShow && outPut('printUrl' , {url :req.url, id : req.id } )
}

function outPut(cmd , val){
	try {
		process.send(JSON.stringify({cmd : cmd , val : val}))
	}catch(err){
		console.log('output error' , err)
	}
}

var nmq = require('./nmq.js')
	,nmqc //must be alone

function start(){
	parseArgs()

	var p = http.createServer(function(req , res){
		///console.log(req.url)
		req.id = getUid()
		if (req.headers.owl) {
			function unSub(){
				//console.log('proxy client request exit')
				nmqc && nmqc.exit()
				nmqc = null
			}
			unSub()
			req.on('exit' , unSub)
			var cstr = caster.bind(req ,res )
			console.log('owl',req.headers.owl)
			cstr.on('echoBk', function(val){
				outPut('echoBk' ,val )
				})
			cstr.on('snapBk', function(val){
				outPut('snapBk' ,val )
				})
			cstr.on('styleBk', function(val){
				outPut('styleBk' ,JSON.parse(val) )
				})
			cstr.on('end' , unSub)

			if ('GET' != req.method) return
			nmqc = nmq.startClient({"port" : config.qPort})
			nmqc.sub('s_' + req.headers.owl , function(cmd){
				if (!cmd) return
				console.log(req.headers.owl ,' to run ' , cmd , cmd.length)
				cstr.send('run',cmd)
				},{times : true})
			return
		}

		if (!( config.url_filter && req.url.indexOf(config.url_filter) == -1 )){
			req.toShow = true
		}
		printReq(req)
		req.startTime = new Date
		if (_set.replace && _set.replace[req.url]){
			res.write(_set.replace[req.url])
			res.end()
			return
		}
		req.pipe(getProxy(req , res))
	}).listen(config.port)
}

start()

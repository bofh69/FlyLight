//
// # IftttServer
//
// A ifttt server program to control a lamp.
//

var config = require("./config");

var http = require('http');
var path = require('path');
var express = require('express');
var webhook = require('express-ifttt-webhook');

var lamp = require("./lampControl");

//
// ## SimpleServer `SimpleServer(obj)`
//
// Creates a new instance of SimpleServer with the following options:
//  * `port` - The HTTP port to listen on. If `process.env.PORT` is set, _it overrides this value_.
//
var router = express();
var server = http.createServer(router);

router.use(express.static(path.resolve(__dirname, 'client')));

server.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function(){
  var addr = server.address();
  console.log("Server listening at", addr.address + ":" + addr.port);
});

function sendLampCommand(c1, c2, cb) {
    lamp.sendLampCommand(config.lamp.port, config.lamp.addr, c1, c2, cb);
}

function setLampColour(name, c) {
    lamp.setLampColour(config.lamp.port, config.lamp.addr, name, c);
}

///////////////////////////////////////////////////////////////////////////////

router.use(webhook(
	    function(user, passwd, done) {
		if(user != config.user ||
		    passwd != config.passwd) {
		    return done(null, false);
		}
		return done(null, user);
	    },
	    function(json, done) {
		console.log("Req: " & json);
		setLampColour("some colour", json.colour);
		done();
	    }));

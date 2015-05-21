//
// # FlyLight
//
// A server program to control a lamp.
//

var config = require("./config");



var dgram = require('dgram');
var socket = dgram.createSocket('udp4');

var server = dgram.createSocket('udp4');
var server2 = dgram.createSocket('udp4');

var client = dgram.createSocket('udp4');


server.on('message', function(message, remote) {
    console.log("Mess: " + message);
    if(message == 'Link_Wi-Fi') {
	var resp = new Buffer('192.168.0.13,D49A205AC083,');
	server.send(resp, 0, resp.length, remote.port, remote.address, function(err, bytes) {
	    console.log('Err: ' + err);
	});;
    };
});

server2.on('message', function(message, remote) {
    console.log("Mess(2): " + message.length);
    console.log("Mess(2): " + message.toString('hex'));
});

server.bind(48899);
server2.bind(8899);

//
// # mightControl.
//
// A component to control a milight lamp.
//


var dgram = require('dgram');
var socket = dgram.createSocket('udp4');

var lampBuffer = new Buffer(2);

var port;
var addr;

exports.setDestination = function(cfg)
{
    port = cfg.port;
    addr = cfg.addr;
    socket.bind(function() {
	if(addr == '255.255.255.255') {
	    socket.setBroadcast(true);
	}
    });
}

exports.sendCommand = function(c1, c2, cb) {
  lampBuffer.writeUInt8(c1, 0);
  lampBuffer.writeUInt8(c2, 1);
  socket.send(lampBuffer, 0, lampBuffer.length, port, addr);
  if (cb !== null) {
    setTimeout(cb, 1000);
  }
}

exports.setColour = function(name, c) {
  console.log("Setting lamp to ", name);
  var cmd = 0x20;
  if(c == 256) {
      cmd = 0xa2;
      c = 0;
  }
  exports.sendCommand(0x25, 0x00, // Speed up/link.
          function() {
	      for(i = 0; i < 20; i++) {
		  exports.sendCommand(cmd, c);
	      }
	  });
}

exports.increaseLight = function() {
    for(i = 0; i < 20; i++) {
	exports.sendCommand(0x23, 0);
    }
}

exports.decreaseLight = function() {
    for(i = 0; i < 20; i++) {
	exports.sendCommand(0x23, 0);
    }
}

exports.turnOn = function() {
    for(i = 0; i < 20; i++) {
	exports.sendCommand(0x22, 0);
    }
}

exports.turnOff = function() {
    for(i = 0; i < 20; i++) {
	exports.sendCommand(0x23, 0);
    }
}

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
var channel;

exports.setDestination = function(cfg)
{
    port = cfg.port;
    addr = cfg.addr;
    channel = cfg.channel - 1;
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

function sendChannelAndCommand(cmd, c)
{
    for(i = 0; i < 20; i++) {
    exports.sendCommand(0x45 + 2*channel, 0x00,
          function() {
	      exports.sendCommand(cmd, c);
	  });
    }
}

exports.setColour = function(name, c) {
  console.log("Setting lamp to ", name);

  var cmd = 0x40;
  if(c == 256) {
      cmd = 0xc2;
      c = 0;
  }
  sendChannelAndCommand(cmd, c);
}

var currentIntensity = 0;

exports.increaseLight = function() {
    currentIntensity += 1;
    sendChannelAndCommand(0x4e, currentIntensity);
}

exports.decreaseLight = function() {
    currentIntensity -= 1;
    sendChannelAndCommand(0x4e, currentIntensity);
}

exports.turnOn = function() {
  sendChannelAndCommand(0x42, 0);
}

exports.turnOff = function() {
  sendChannelAndCommand(0x41, 0);
}

//
// # FlyLight
//
// A server program to control a lamp.
//

var config = require("./config");

var http = require('http');
var path = require('path');
var express = require('express');


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

var dgram = require('dgram');
var socket = dgram.createSocket('udp4');
var lampBuffer = new Buffer(3);
function sendLampCommand(c1, c2, cb) {
  lampBuffer.writeUInt8(c1, 0);
  lampBuffer.writeUInt8(c2, 1);
  lampBuffer.writeUInt8(0x55, 2);
  // TODO: Configuration:
  socket.send(lampBuffer, 0, 3, config.lamp.port, config.lamp.addr);
  if (cb !== null) {
    setTimeout(cb, 1000);
  }
}

function convertKnotToMps(knot)
{
  return knot/1.9438444924574;
}

function parseClientRaw(str) {
  var result = {};

  var splitBody = str.split(' ');
  result.dir = splitBody[3];
  result.avgSpeed = convertKnotToMps(splitBody[1]);
  result.maxSpeed = convertKnotToMps(splitBody[2]);
  result.name = splitBody[32].replace(/_/g, " ");

  return result;
}

function createWeatherFilter(cfg) {
  var filter = {};
  
  filter.cfg = cfg;

  filter.accept = function(dir, wind) {
    if(cfg.dirMin < 0) {
      if((dir > cfg.dirMax) &&
         (dir <(cfg.dirMin+360))) {
           console.log("Wrong direction", dir, "(" + cfg.dirMin + ", " + cfg.dirMax +")");
           return false;
         }
    } else {
      if(dir < cfg.dirMin || dir > cfg.dirMax) {
        console.log("Wrong direction", dir, "(" + cfg.dirMin + ", " + cfg.dirMax +")");
        return false;
      }
    }
    if((wind < cfg.windMin) || (wind > cfg.windMax)) {
      console.log("Wrong windspeed", wind, "(" + cfg.windMin + ", " + cfg.windMax +")");
      return false;
    }
    
    return true;
  };
  
  return filter;
}

function createHistory(filter) {
  var result = {};
  result.history = [];
  result.filter = filter;
  result.addSample = function(dir, wind) {
    var result = this.filter.accept(dir, wind);
    this.history.push(result);
    if(this.history.length > config.maxHistory) this.history.pop();
  };
  result.isOk = function() {
    return this.history.reduce(function(current, prev) {
      if(!prev || !current) return false;
      return true;
    }, true);
  };
  return result;
}

function pollServer(url, history) {
  http.get(url, function(res) {
    if (res.statusCode == 200) {
      var body = "";
      res.on('data', function(chunk) {
        body += chunk;
      });
      res.on('end', function() {
        // console.log("Got result: ", body);
        var wd = parseClientRaw(body);
        console.log("Station name: ", wd.name);
        console.log("Current direction: ", wd.dir);
        console.log("Current avg: ", wd.avgSpeed);
        history.addSample(wd.dir, wd.avgSpeed);
      });
    }
  });
}

function initPoller(url, history) {
  pollServer(url, history);
  setInterval(function() {pollServer(url, history)}, 60*1000);
}

function setLampColour(name, c) {
  console.log("Setting lamp to ", name)
  sendLampCommand(0x25, 0x00, // Speed up/link.
          function() { sendLampCommand(0x20, c,
              function() { sendLampCommand(0x20, c); })});
}

function updateLamp(history) {
  if(history.isOk()) {
    setLampColour("green", config.lamp.greenColour);
  } else {
    setLampColour("red", config.lamp.redColour);
  }
}

setLampColour("yellow", config.lamp.yellowColour);

///////////////////////////////////////////////////////////////////////////////

var history = [];

config.windMeeters.forEach(function (cfg) {
  var hist = createHistory(createWeatherFilter(cfg));
  history.push(hist);
  initPoller(cfg.url, hist);
});

var aggHistory = {};
aggHistory.isOk = function() {
  return history.reduce(function(o, n) {
    return o || n.isOk();
    }, false)
};

setInterval(function() {updateLamp(aggHistory)}, 60*1000);

router.get('/colour', function (req, res) {
  var response = "<html><body>";
  if(aggHistory.isOk()) {
    response += "FLY";
  } else {
    response += "DONT FLY";
  }
  response += "<br>";
  response += history[0].history.join(" (1) <br>");
  response += " (1) <br>";
  response += history[1].history.join(" (2) <br>");
  response += " (2) <br>";
  response += "</body></html>";
  res.send(response);
});
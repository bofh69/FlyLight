//
// # FlyLight
//
// A server program to control a lamp.
//

var config = require("./config");

var http = require('http');
var path = require('path');
var express = require('express');

var lamp = require('./lampControl');


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
      console.log("Windspeed", wind, "(" + cfg.windMin + ", " + cfg.windMax +")");
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
    if(this.history.length > config.maxHistory) this.history.shift();
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
        var wd = parseClientRaw(body);
        console.log("Station name: ", wd.name);
        console.log("Current direction: ", wd.dir);
        console.log("Current avg: ", wd.avgSpeed);
        history.addSample(wd.dir, wd.avgSpeed);
      });
    }
  }).on('error', function(e) {
      console.log("Got error while reading weather station '" + url + "': " + e.message);
  });;
}

function initPoller(url, history) {
  pollServer(url, history);
  setInterval(function() {pollServer(url, history)}, 60*1000);
}

function updateLamp(history) {
  if(history.isOk()) {
    lamp.setColour("green", config.lamp.greenColour);
  } else {
    lamp.setColour("red", config.lamp.redColour);
  }
}

///////////////////////////////////////////////////////////////////////////////

lamp.setDestination(config.lamp);

lamp.setColour("yellow", config.lamp.yellowColour);

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

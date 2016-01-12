//
// # FlyLight
//
// A server program to control a lamp.
//

var webServer = require("./webServer.js");

var cfgname = "config";
if(process.argv.length > 2) {
    cfgname = process.argv[2];
}

var config = require("./" + cfgname);

var lamp = require("./" + config.lamp.driver + "Controller");

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

function pollServer(cfg, history) {
    var reader = require("./" + cfg.reader + "Reader");
    reader.pollServer(cfg, function(wd) {
	console.log("Station name: ", wd.name);
	console.log("Current direction: ", wd.dir);
	console.log("Current avg: ", wd.avgSpeed);
	history.addSample(wd.dir, wd.avgSpeed);
    });
}

function initPoller(cfg, history) {
  pollServer(cfg, history);
  setInterval(function() {pollServer(cfg, history)}, 60*1000);
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
  initPoller(cfg, hist);
});

var aggHistory = {};
aggHistory.isOk = function() {
  return history.reduce(function(o, n) {
    return o || n.isOk();
    }, false)
};

setInterval(function() {updateLamp(aggHistory)}, 60*1000);

webServer.init(config, aggHistory);

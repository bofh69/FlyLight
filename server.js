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
    dir = parseFloat(dir);
    wind = parseFloat(wind);
    if(cfg.dirMin < 0) {
      if((dir > cfg.dirMax) &&
         (dir <(cfg.dirMin+360))) {
           console.log("Wrong direction", dir, "(" + cfg.dirMin + ", " + cfg.dirMax +")");
           return 0;
         }
    } else {
      if(dir < cfg.dirMin || dir > cfg.dirMax) {
        console.log("Wrong direction", dir, "(" + cfg.dirMin + ", " + cfg.dirMax +")");
        return 0;
      }
    }
    console.log("Windspeed", wind, "(" + cfg.windMin + ", " + cfg.windMax +")");
    if((wind < cfg.windMin)) {
      console.log("Wrong windspeed", wind, "(" + cfg.windMin + ", " + cfg.windMax +")");
      return 0;
    } else if(wind > cfg.windMax) {
      // TODO: add support for another max windspeed...
      console.log("Wrong windspeed", wind, "(" + cfg.windMin + ", " + cfg.windMax +")");
      return 0;
    }
    
    return 1;
  };
  
  return filter;
}

function createWindHistory(filter) {
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
      if(prev == 0 || current == 0) return 0;
      return prev | current;
    }, 1);
  };
  return result;
}

function pollServer(cfg, history) {
    var reader = require("./" + cfg.reader + "Reader");
    reader.pollServer(cfg, function(wd) {
	if(wd) {
	    console.log("Station name: ", wd.name);
	    console.log("Current direction: ", wd.dir);
	    console.log("Current avg: ", wd.avgSpeed);
	    console.log("Current temp: ", wd.temp);
	    history.addSample(wd.dir, wd.avgSpeed);
	    history.temp = wd.temp;
	}
    });
}

function initPoller(cfg, history) {
  pollServer(cfg, history);
  setInterval(function() {pollServer(cfg, history)}, 60*1000);
}

function updateLamp(history) {
  if(config.mode == "wind") {
    if(history.isOk() > 0) {
      lamp.setColour("green", config.lamp.greenColour);
    } else {
      lamp.setColour("red", config.lamp.redColour);
    }
  } else {
    // Convert history.temp to color gradient.
    var t = history.getTemp();
    var min = config.tempConfig.minTemp;
    var max = config.tempConfig.maxTemp;
    if (t < min) t = min;
    if (t > max) t = max;
    t -= min;
    var col = Math.floor(config.lamp.tempColors.length * t / (max - min));
    var col = config.lamp.tempColors[col];
    lamp.setColour(history.getTemp() + "C (colidx=" + col + ")", col);
  }
}

///////////////////////////////////////////////////////////////////////////////

lamp.setDestination(config.lamp);

lamp.setColour("yellow", config.lamp.yellowColour);

var history = [];

config.windMeeters.forEach(function (cfg) {
  var hist = createWindHistory(createWeatherFilter(cfg));
  history.push(hist);
  initPoller(cfg, hist);
});

var aggHistory = {};
aggHistory.isOk = function() {
  return history.reduce(function(o, n) {
    return o || n.isOk();
    }, false)
};
aggHistory.getTemp = function() {
  return history[0].temp;
};

setInterval(function() {updateLamp(aggHistory)}, 60*1000);

webServer.init(config, aggHistory);

//
// # Monitoring/Configuring WebbServer for FlyLight
//

var http = require('http');
var path = require('path');
var express = require('express');
var fs = require('fs');

// Creates a new instance of SimpleServer with the following options:
//  * `port` - The HTTP port to listen on. If `process.env.PORT` is set, _it overrides this value_.
//

exports.init = function(cfg, aggHistory) {
  var app = express();
  var server = http.createServer(app);

  app.use(express.static(path.resolve(__dirname, 'html')));
  app.set('view engine', 'jade');
  app.set('views', './views');

  app.get('/colour', function (req, res) {
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

  app.get('/svc/config', function (req, res) {
    res.send(cfg);
  });

  app.post('/svc/config', function (req, res) {
    var body = "";
    try {
      req.on('data', function(chunk) {
	body += chunk;
      });
      req.on('end', function() {
        try {
	var o = JSON.parse(body);
	console.log(JSON.stringify(o));
	} catch(e) {
	  console.log("Got error when receiving config: " + e);
	  res.send(422, "Got error when parsing the new config file: " + e);
	  return;
	}
	var newName = "config.json.new";
	fs.writeFile(newName, body, function(err) {
	  if(!err) {
	    var cfgName = "config.json";
	    var backupName = "config.json.old";
            try {
	      fs.unlinkSync(backupName);
            } catch(e) {
	      console.log("Got error when removing old config file, continuing: " + e);
            }
	    fs.linkSync(cfgName, backupName);
	    fs.renameSync(newName, cfgName);
	    res.send("OK", function() {
	      // TODO: This function doesn't exist, but it will crash the program and then it will restart...
	      restart();
	    });
	  } else {
	    res.send(500, err);
	  }
	});
      });
    } catch(e) {
      console.log("Got error when receiving config: " + e);
      res.send(422, "Got error when parsing the new config file: " + e);
    }
  });

  app.get('/svc/lampDrivers', function (req, res) {
    res.send([
      {"id": "milightRBG",
       "name": "RGB"},
      {"id": "milightRBGW",
       "name": "RGBW"},
    ]);
  });

/*
app.get('/', function (req, res) {
    res.render('index', {title: 'Hej', message: 'Hello there!'});
});

*/


  server.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function(){
    var addr = server.address();
      console.log("Server listening at", addr.address + ":" + addr.port);
  });

}

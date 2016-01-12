//
// # Monitoring/Configuring WebbServer for FlyLight
//

var http = require('http');
var path = require('path');
var express = require('express');

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


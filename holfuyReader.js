//
// # holfuyReader
//
// A module to read weather-data (wind direction and speed).
//

var http = require("http");

function parseObject(o) {
  var result = {};

  if(o.error) {
    console.log("Got error from holfuy station: ");
    console.log(o);
    return null;
  }

  result.dir = o.wind.direction;
  result.avgSpeed = o.wind.speed;
  result.maxSpeed = o.wind.gust;
  result.name = o.stationName;

  return result;
}

exports.pollServer = function(cfg, cb) {
  var url = cfg.url + cfg.args.PlatsId;
  // console.log(url);
  http.get(url, function(res) {
    if (res.statusCode == 200) {
	try {
	    var body = "";
	    res.on('data', function(chunk) {
		body += chunk;
	    });
	    res.on('end', function() {
	        // console.log(body);
		var wd = parseObject(JSON.parse(body));
		cb(wd);
	    });
	} catch(ex) {
	    console.log("Got error while parsing weather station '" + cfg.url + "': " + ex);
	};
    }
  }).on('error', function(e) {
      console.log("Got error while reading weather station '" + cfg.url + "': " + e.message);
  });;
}

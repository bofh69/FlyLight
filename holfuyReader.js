//
// # holfuyReader
//
// A module to read weather-data (wind direction and speed).
//

var http = require("http");

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

exports.pollServer = function(cfg, cb) {
  http.get(cfg.url, function(res) {
    if (res.statusCode == 200) {
	try {
	    var body = "";
	    res.on('data', function(chunk) {
		body += chunk;
	    });
	    res.on('end', function() {
		var wd = parseClientRaw(body);
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

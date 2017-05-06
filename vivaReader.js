//
// # vivaReader
//
// A module to read weather-data (wind direction and speed).
//

var https = require("https");

function parseObject(o) {
  var result = {};

  o = o.GetSingleStationResult;

  result.dir = o.Samples[1].Heading;
  result.avgSpeed = o.Samples[1].Value.split(' ')[1];
  result.maxSpeed = o.Samples[0].Value.split(' ')[1];
  result.name = o.Name;
  result.temp = 20; // They don't say.

  return result;
}

exports.pollServer = function(cfg, cb) {
  https.get(cfg.url + cfg.args.PlatsId, function(res) {
    if (res.statusCode == 200) {
	try {
	    var body = "";
	    res.on('data', function(chunk) {
		body += chunk;
	    });
	    res.on('end', function() {
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

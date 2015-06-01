//
// # vivaReader
//
// A module to read weather-data (wind direction and speed).
//

exports.pollServer = function(cfg, cb) {
    var soap = require("soap");

    soap.createClient(cfg.url, function(err, client) {
	if(err == null) {
	    client.GetViVaData(cfg.args, function(err, result) {
		if(err == null) {
		    result = result.GetViVaDataResult;
		    if(result.Felmeddelande != null) {
			console.log("Got error from GetViVaData call:" + result.Felmeddelande);
		    } else {
			var wd = {};
			wd.name = result.PlatsNamn;
			result.ViVaData.forEach(function(o) {
			    o = o.attributes;
			    if(o.Typ == 'Riktning') {
				wd.dir = o.Varde;
			    } else if(o.Typ == 'Medelvind') {
				wd.avgSpeed = o.Varde;
			    } else if(o.Typ == 'Bywind') {
				wd.maxSpeed = o.Varde;
			    }
			});
			if(!wd.avgSpeed) {
			    console.log("Didn't get wanted data, got:", result.ViVaData);
			}
			cb(wd);
		    }
		} else {
		    console.log("Got error: " + err);
		};
	    });
	} else {
	    console.log("Got error: " + err);
	};
    });
}

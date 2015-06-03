#!/usr/bin/env node

var soap = require("soap");

var url = 'http://161.54.134.239/vivadata.asmx?WSDL';

// https://www.google.se/maps/@57.9525834,11.5709113,19z?hl=sv

var mapUrl = 'https://www.google.se/maps/@';

soap.createClient(url, function(err, client) {
    if(err == null) {
	    client.GetViVaPoints(function(err, result) {
		    // Sort from south to north:
		    if(err == null) {
			    result.GetViVaPointsResult.ViVaPoint.sort(function(a, b) {
				var aLatitude = a.attributes.Latitude.replace(',', '.');
				var bLatitude = b.attributes.Latitude.replace(',', '.');
				return aLatitude - bLatitude;
			    }).forEach(function(o) {
				o = o.attributes;
				o.Latitude = o.Latitude.replace(',', '.');
				o.Longitude = o.Longitude.replace(',', '.');
				// Print the id, name and an URL to google maps:
				console.log('Id:', o.PlatsId, 'Namn:', o.Platsnamn, mapUrl + o.Latitude + ',' + o.Longitude + ',13z');
			    });
		    } else {
		    	console.log("Got error response from server: " + err)
		    }
		});
    } else {
	    console.log("Got error: " + err);
    }
});

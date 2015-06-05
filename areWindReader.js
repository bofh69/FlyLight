//
// # holfuyReader
//
// A module to read weather-data (wind direction and speed).
//

var http = require("http");
var Parser = require("parse5").Parser;

function getChildNodes(nod, name) {
	var result = [];
	result = nod.childNodes.filter(function (child, idx) {
		return child.nodeName == name;
	});
	return result;
}

function getNodeFromPath(nod, path) {
	path.split('/').forEach(function (pathPart) {
		var lastIdx = pathPart.lastIndexOf('[');
		var nodName = pathPart;
		var count = 0;
		if(lastIdx >= 0) {
			nodName = pathPart.substring(0, lastIdx);
			count = pathPart.substring(lastIdx+1, pathPart.length-1) - 1;
		}
		var nodes = getChildNodes(nod, nodName);
		if(nodes.length == 0) {
			return [];
		}
		nod = nodes[count];
	});
	return nod;
}

function getNodeById(nod, id)
{
	if(nod.attrs && nod.attrs.length > 0) {
		for(var i in nod.attrs) {
			var attr = nod.attrs[i];
			if(attr.name == 'id' && attr.value == id) {
				return nod;
			}
		}
	}
	if(nod.childNodes) {
		for(var i in nod.childNodes) {
			var cNod = nod.childNodes[i];
			var res = getNodeById(cNod, id);
			if(res) return res;
		}
	}
}

function parseBody(body) {
	var result = {};
	
	var parser = new Parser;
	
	var document = parser.parse(body);
	
	var child = getNodeById(document, "meac_main_box");
	var text = getNodeFromPath(child, "table/tbody/tr[2]/td[1]/div[3]/#text").value;
    result.avgSpeed = text.split(' ')[0];
    
	var text = getNodeFromPath(child, "table/tbody/tr[2]/td[3]/div[3]/#text").value;
    result.dir = text.substr(0, text.length-1);

	result.name = getNodeFromPath(document, "html/head/title/#text").value;
	
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
		var wd = parseBody(body);
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

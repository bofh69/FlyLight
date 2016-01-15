// En massa fulhack staplade på varandra. :-)

/* TODO:

  Translate sensor names to some screen-name.

  Fetch sensor names from server.

  Error handling.

  Better validation of input.

  Wizards for sensors to get proper URLs.

  Build JSON-config from the form.

  Use proper conversion methods for the colours.
  Encapsulate it in an object.

  Use templates for the form parts? Fetch from the html page?

  Build the form from JSON-schema?

*/


var hexToIntChar = function(n) {
  n = n.charCodeAt(0);
  if(n <= 0x39) return n - 0x30;
  return 10 + (n - 65);
  };

var hexToInt = function(n) {
  return hexToIntChar(n[0])*16 +
	 hexToIntChar(n[1]);
};

var intToHexChar = function(n) {
  if(n>9) return "ABCDEF"[n-10];
  return "" + n;
};

var intToHex = function(n) {
  return intToHexChar(n >> 4) + intToHexChar(n & 15);
};

var interpret = function(from, to, i) {
  var f = hexToInt(from);
  var t = hexToInt(to);
  return intToHex(255 & (f + i*(t - f)/16));
};

var colours = [
  "#EE82EE", "#4169E1", "#87CEFA", "#00FFFF",
  "#7FFFD4", "#2E8B57", "#008000", "#32CD32",
  "#FFFF00", "#DAA520", "#FFA500", "#FF0000",
  "#FFC0CB", "#FF00FF", "#DA70D6", "#E6E6FA" ];

var intCol = [];

for(i = 0; i < colours.length; i++) {
  var cc = colours[i];
  intCol.push(cc);
  var ni = i+1;
  if(i == colours.length-1) ni = 0;
  var nc = colours[ni];
  var cr = cc.substr(1, 2);
  var nr = nc.substr(1, 2);
  var cg = cc.substr(3, 2);
  var ng = nc.substr(3, 2);
  var cb = cc.substr(5, 2);
  var nb = nc.substr(5, 2);
  for(x = 1; x < 16; x++) {
    var ir = interpret(cr, nr, x)
      var ig = interpret(cg, ng, x)
      var ib = interpret(cb, nb, x)
      intCol.push("#" + ir + ig + ib);
  }
}

function convertToRGB(number) {
  if(number <= 0 || number > 255) number = 0;
  return intCol[number];
}

function distanceBetweenColours(cc, nc) {
  var pow2 = function(n) {
    return n * n;
  };
  var cr = hexToInt(cc.substr(1, 2));
  var nr = hexToInt(nc.substr(1, 2));
  var cg = hexToInt(cc.substr(3, 2));
  var ng = hexToInt(nc.substr(3, 2));
  var cb = hexToInt(cc.substr(5, 2));
  var nb = hexToInt(nc.substr(5, 2));

  return pow2(cr-nr) +
         pow2(cg-ng) +
         pow2(cb-nb);

};

function convertFromRGB(number) {
  var closest = 0;
  var distance = 0xffffff;
  for(i = 0; i < intCol.length; i++) {
    var cd = distanceBetweenColours(number, intCol[i]);
    if(cd < distance) {
      distance = cd;
      closest = i;
    }
  }
  return closest;
}

function convertLampTypeToDriver(val) {
  switch(val) {
    case "RGB": return "milightRGB";
    case "RGBW": return "milightRGBW";
  }
  console.error("Unknown lamp type " + val);
}

function selected(value, desiredValue) {
  if(value == desiredValue) return " selected ";
  return "";
}

function formatOptions(values, value) {
  var result = [];
  $.each(values, function(i, v) {
    result.push('<option ' + selected(value, v[0]) + '>' + v[1] + '</option>');
  });
  return result.join('');
}

function formGroupPrefix(id, label) {
  return '<div class="form-group">' +
	  '<label for="' + id + '" class="col-sm-5 control-label">' +
	      label +
	  '</label>' +
	  '<div class="col-sm-7">';
}

function formGroupPostfix() {
  return '</div>' +
	'</div>';
}

function formatForInput(id, label, type, value, min, max)
{
  var ranges = "";
  if(min !== undefined) {
    ranges = ' min="' + min + '"';
  }
  if(max !== undefined) {
    ranges += ' max="' + max + '"';
  }
  return formGroupPrefix(id, label) +
	      '<input type="' + type + '" class="form-control"' +
		     ranges + ' id="' + id + '" value="' + value + '">' +
	  formGroupPostfix();
}

function formatForSelect(id, label, value, values)
{
  return formGroupPrefix(id, label) +
			'<select id="' + id + '">' +
			  formatOptions(values, value) +
			'</select>' +
	  formGroupPostfix();
}

function fillLampConfig(config) {
  $('#lampConfig')[0].innerHTML =
  formatForInput('minutesToConsider', 'Minutes to Consider',
                    'number', config.maxHistory) + 
  formatForSelect('lampType', 'Lamp Type', config.lamp.driver,
                     [['milightRGB', 'RGB'],
                      ['milightRGBW', 'RGBW']]) +
  formatForInput('lampChannel', 'Lamp channel',
                    'number', config.lamp.channel, 1, 4) + 
  formatForInput('lampAddress', 'IP-address',
                    'text', config.lamp.addr) + 
  formatForInput('lampPort', 'TCP-Port',
                    'text', config.lamp.port, 1, 65535) + 
  formatForInput('lampNoFlyColour', 'No-fly Colour',
                    'color', convertToRGB(config.lamp.redColour)) + 
  formatForInput('lampUnknownColour', 'Unknown-flyability Colour',
                    'color', convertToRGB(config.lamp.yellowColour)) + 
  formatForInput('lampFlyColour', 'Fly Colour',
                    'color', convertToRGB(config.lamp.greenColour));

  $('input[type="color"]').on('change', function(e) {
   var c = e.currentTarget.value;
   e.currentTarget.value = convertToRGB(convertFromRGB(c));
});
}

var storedSensorsHTML;

function fillSensorsConfig(config) {

  if(storedSensorsHTML === undefined) {
    storedSensorsHTML = $('#sensors')[0].innerHTML;
  }

  var sens = [];
  $.each(config, function(i, d) {
    var extra = "";
    if(d.reader == "viva") {
      extra = 
	formatForInput('s' + i + 'PlaceId', 'Id of sensor',
			  'number', d.args.PlatsId, 0);
    }
    var comment = "";
    if(d.args && d.args.Kommentar) comment = d.args.Kommentar;
    sens.push(
    '<div class="sensor">' +
      formGroupPrefix('s' + i + 'type', "Type of Sensor") +
      '<input type="string" readonly="true" id="s' + i + 'type" ' +
              'value="' + d.reader + '">' +
      '<a class="removeSensor" href="#"><span class="glyphicon glyphicon-remove"></a>' +
      formGroupPostfix() +
      formatForInput('s' + i + 'url', 'URL',
			'string', d.url) + 
      extra + 
      formatForInput('s' + i + 'comment', 'Comment',
			'string', comment) + 
      formatForInput('s' + i + 'windMin', 'Minimum windspeed (m/s)',
			'number" step="0.5', d.windMin, 0, 25) + 
      formatForInput('s' + i + 'windMax', 'Maximum windspeed (m/s)',
			'number" step="0.5', d.windMax, 0, 25) + 
      formatForInput('s' + i + 'dirMin', 'From direction',
			'number', d.dirMin, 0, 359) + 
      formatForInput('s' + i + 'dirMax', 'To direction',
			'number', d.dirMax, 0, 359) + 
    '</div>'
    );
  });
  sens.push(storedSensorsHTML);

  $('#sensors')[0].innerHTML = sens.join("");

  $('.removeSensor').each(function(i, v) {
    v.onclick = function(e) {
      e.preventDefault();
      cfg.windMeeters.splice(i, 1);
      fillSensorsConfig(cfg.windMeeters);
    }
  });

  $('#AddSensor a').on('click', function(e) {
    e.preventDefault();
    addSensor($('#newSensorType')[0].value);
  });
}

var cfg;

function addSensor(type) {
  var o = {reader: type};
  o.args = {};
  switch(type) {
    case "viva": o.url = "http://161.54.134.239/vivadata.asmx?WSDL"; o.args.placeId = "1"; break;
    case "holfuy": o.url = "http://holfuy.hu/clientraw/s214/clientraw.txt"; break;
    case "areWind": o.url = "http://www.meac.se/sub_2/hummeln/wind.asp"; break;
  }
  o.args.Kommentar = "";
  o.dirMin = 0;
  o.dirMax = 359;
  o.windMin = 0;
  o.windMax = 10;
  cfg.windMeeters.push(o);
  fillSensorsConfig(cfg.windMeeters);
}

function storeConfig() {
  var newCfg = {};
  newCfg.user = cfg.user;
  newCfg.passwd = cfg.passwd;
  newCfg.maxHistory = $('#minutesToConsider')[0].value;
  newCfg.lamp = {};
  newCfg.lamp.driver = convertLampTypeToDriver($('#lampType')[0].value);
  newCfg.lamp.channel = $('#lampChannel')[0].value;
  newCfg.lamp.addr = $('#lampAddress')[0].value;
  newCfg.lamp.port = $('#lampPort')[0].value;
  newCfg.lamp.redColour = convertFromRGB($('#lampNoFlyColour')[0].value);
  newCfg.lamp.greenColour = convertFromRGB($('#lampFlyColour')[0].value);
  newCfg.lamp.yellowColour = convertFromRGB($('#lampUnknownColour')[0].value);

  newCfg.windMeeters = [];

  $('.sensor').each(function(i, s) {
    var o = {};
    o.reader = $('input[id$="type"]', s)[0].value;
    o.url = $('input[id$="url"]', s)[0].value;
    o.args = {};
    o.args.Kommentar = $('input[id$="comment"]', s)[0].value;
    // TODO: depends on reader (only for VIVA):
    var placeIds = $('input[id$="PlaceId"]', s);
    if(placeIds.length > 0) {
      o.args.PlatsId = placeIds[0].value;
    }
    o.windMin = $('input[id$="windMin"]', s)[0].value;
    o.windMax = $('input[id$="windMax"]', s)[0].value;
    o.dirMin = $('input[id$="dirMin"]', s)[0].value;
    o.dirMax = $('input[id$="dirMax"]', s)[0].value;
    newCfg.windMeeters.push(o);
  });

  jQuery.post("svc/config", JSON.stringify(newCfg)).fail(function(e) {
    // TODO: Show error!
    console.error(e);
  });
  /*
  $('#lampConfig')[0].innerHTML =
      "Old config: " + JSON.stringify(cfg) + '<br><br>' +
      "New config: " + JSON.stringify(newCfg);
  */
}

// Fetch the config and update the DOM as a result.
function fetchConfig() {
  $('#lampConfig')[0].innerHTML = 'Loading config...';
  console.info('Loading config');
  jQuery.getJSON("svc/config", function(config) {
    cfg = config;
    fillLampConfig(config);
    fillSensorsConfig(config.windMeeters);
  });
}

// If the config has never been loaded, load it when the config tab
// is shown for the first time.
$('a[href="#config"]').on('show.bs.tab', function(e) {
  if($('#lampConfig .form-group').length == 0) {
    fetchConfig();
  }
});

$('#configForm').on('submit', function(e) {
  e.preventDefault();
  storeConfig();
});

// Wire the undo button to reload the config.
$('#undoConfig').on('click', fetchConfig);

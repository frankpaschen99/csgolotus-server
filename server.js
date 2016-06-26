var server = require('http').createServer(),
io = require('socket.io')(server),
logger = require('winston'),
port = 8080;
var request = require("request");
var numConnected = 0;

var mysql      = require('mysql');
var connection = mysql.createConnection({
	host     : 'localhost',
	user     : 'csgolotus',
	password : 'ufUL3e86NqUqjhV',
	database : 'csgolotus'
});

connection.connect();

logger.remove(logger.transports.Console);
logger.add(logger.transports.Console, {
	colorize: true,
	timestamp: true
});
logger.info('Server > listening on port ' + port);
io.on('connection', function(socket) {
	logger.info('Server > Connected socket ' + socket.id);
	numConnected++
	console.log("Clients Connected: " + numConnected);
	socket.on('broadcast', function(message) {
		logger.info('CSGOLotus broadcast > ' + JSON.stringify(message));
		io.emit('gamedata', message)
	});
	socket.on('response', function(message) {
		logger.info('Scruffybot response > ' + message);

		var json = JSON.parse(message);
		var SID64 = json.sid;
		var assetids = json.items;
		var flag = json.flag;

		if (flag == "special") {
			findOriginalIds( assetids, SID64 );
		} else {
			calcSkinValues( assetids, SID64);
		}
	});
	socket.on('disconnect', function() {
		logger.info('Server > Disconnected socket ' + socket.id);
		numConnected--;
		console.log("Clients Connected: " + numConnected);
	})
});
function findOriginalIds( assetids, sid64 ) {
	// here, the bot will take the assetids provided by the steambot, and compare them to the inventory JSON of the player
	// using their STEAMID64, and take the original_ids that correspond.
	console.log("findOriginalIds() called!");

	// Two options here: use the assetids provided by the steambot to find the original_ids
	// manually, or send a request back to scruffybot to find the original_ids using the trade id
}
function calcSkinValues( assetids, sid64 ) {
	var market_hash_names = [];
	var bot_inventory = "http://steamcommunity.com/id/thescruffybot/inventory/json/730/2"; // this will be more dynamic when we have multiple bots
	var market_schema = "https://www.dropbox.com/s/a0tthgg81vsdjdq/market_schema.json?dl=0&raw=1";
	var skinValueUSD = 0.00;
	request({
		url: bot_inventory,
		json: true
	}, function (error, response, body) {
		for (var i = 0; i < assetids.length; i++) {
			for (var y in body.rgDescriptions) {
				if (body["rgInventory"][assetids[i]]["classid"] == body["rgDescriptions"][y]["classid"]/* && body["rgInventory"][assetids[i]]["instanceid"] == body["rgDescriptions"][y]["instanceid"]*/) {
					market_hash_names.push(body["rgDescriptions"][y]["market_hash_name"]);
				}
			}
		}
	});
	for (var i = 0; i < market_hash_names.length; i++) {
		console.log("outside request: " + market_hash_names[i]);
	}
	// use the market_hash_names to get the USD value of the skins
	request({
		url: market_schema,
		json: true
	}, function (error, response, body) {
		for (var i = 0; i < market_hash_names.length; i++) {
			skinValueUSD += body["response"]["items"][market_hash_names[i]]["value"];
		}
		sqlUpdateUserBalance(sid64, skinValueUSD);
	});
}
function getBalance( sid64 ) {
	var balance = 0;
	connection.query( 'SELECT credits FROM users WHERE STEAMID64 = ?', [sid64], function(err, rows) {
		return rows[0]['credits'];
	});
}
function sqlUpdateUserBalance( sid64, usdValue ) {
	var creditValue = getBalance(sid64) + (((usdValue/100)/0.03)*100);
	console.log("Total value in USD: " + usdValue);
	connection.query('UPDATE users SET credits = ? WHERE STEAMID64 = ?', [creditValue, sid64], function(err, results) {});
}
server.listen(port);

var server = require('http').createServer(),
io = require('socket.io')(server),
logger = require('winston'),
port = 8080;
var request = require("request");
var numConnected = 0;

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
		var bot_inventory = "http://steamcommunity.com/id/thescruffybot/inventory/json/730/2"; // this will be more dynamic when we have multiple bots
		var market_schema = "https://www.dropbox.com/s/a0tthgg81vsdjdq/market_schema.json?dl=0&raw=1";
		var market_hash_names = [];
		// fetch market_hash_names from bot's inventory
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
		}.bind(this));
		for (var i = 0; i < market_hash_names.length; i++) {
			console.log("outside request: " + market_hash_names[i]);
		}
		// use the market_hash_names to get the USD value of the skins
		request({
			url: market_schema,
			json: true
		}, function (error, response, body) {
			var skinValueUSD = 0.00;
			for (var i = 0; i < market_hash_names.length; i++) {
				skinValueUSD += body["response"]["items"][market_hash_names[i]]["value"];
			}
			console.log(skinValueUSD);
		});
	});
	socket.on('disconnect', function() {
		logger.info('Server > Disconnected socket ' + socket.id);
		numConnected--;
		console.log("Clients Connected: " + numConnected);
	})
});
function sqlUpdateUserBalance( sid64, usdValue ) {
	console.log("Total value in USD: " + usdValue);
}
server.listen(port);

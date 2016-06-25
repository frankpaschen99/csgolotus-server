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
		var market_hash_names = [];
		request({
			url: bot_inventory,
			json: true
		}, function (error, response, body) {
			for (var i = 0; i < assetids.length; i++) {
				for (var y in body.rgDescriptions) {
					if (body.rgInventory[assetids[i]].classid == body.rgDescriptions[y].classid && body.rgInventory[assetids[i]].instanceid == body.rgDescriptions[y].instanceid) {
						market_hash_names.push(body.rgDescriptions[y].market_hash_name);
					}
				}
			}
		})
		// now that market_hash_names has been populated, compare them to the BP.TF schema, then query
		// the sql server.

		// BP.TF schema url for skin values (will later be on our file server, being updated every 5 minutes)
		// http://backpack.tf/api/IGetMarketPrices/v1/?key=56cd0ca5b98d88be2ef9de16&appid=730

	});
	socket.on('disconnect', function() {
		logger.info('Server > Disconnected socket ' + socket.id);
		numConnected--;
		console.log("Clients Connected: " + numConnected);
	})
});
server.listen(port);

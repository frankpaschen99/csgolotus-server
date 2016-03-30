var server = require('http').createServer(),
    io = require('socket.io')(server),
    logger = require('winston'),
    port = 8080;
logger.remove(logger.transports.Console);
logger.add(logger.transports.Console, {
    colorize: true,
    timestamp: true
});
logger.info('Server > listening on port ' + port);
io.on('connection', function(socket) {
    logger.info('Server > Connected socket ' + socket.id);
    socket.on('broadcast', function(message) {
        logger.info('CSGOLotus broadcast > ' + JSON.stringify(message));
        io.emit('gamedata', message)
    });
	socket.on('response', function(message) {
		logger.info('Scruffybot response > ' + JSON.stringify(message));
		
		// here the bot will need to take the original_ids from the response and compare it to the 
		// original_ids in scruffybot's inventory, then take the assetid that it corresponds to, use that to
		// fetch the market_hash_name, then use that to fetch the $$ value from the BP.TF schema.
		
		// this is the url needed to compare to scruffybot's original_ids
		// https://api.steampowered.com/IEconItems_730/GetPlayerItems/v1/?key=2457B1C97418CC3095E99484AF2DC660&steamid=76561198180102897
		// this is the url needed to compare the assetids to find the market_hash_name
		// http://steamcommunity.com/id/thescruffybot/inventory/json/730/2
		// BP.TF schema url for skin values (will later be on our file server, being updated every 5 minutes)
		// http://backpack.tf/api/IGetMarketPrices/v1/?key=56cd0ca5b98d88be2ef9de16&appid=730
	});
    socket.on('disconnect', function() {
        logger.info('Server > Disconnected socket ' + socket.id);
    })
});
server.listen(port);

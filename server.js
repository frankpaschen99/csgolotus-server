/*
	Socket.io server for handling interactions between the CSGOLotus backend and
	the automated Steambot.
*/

var server     = require('http').createServer(),
    io         = require('socket.io')(server),
    logger     = require('winston'),
    port       = 8080;

// Logger config
logger.remove(logger.transports.Console);
logger.add(logger.transports.Console, { colorize: true, timestamp: true });
logger.info('Server > listening on port ' + port);

io.on('connection', function (socket){
    logger.info('Server > Connected socket ' + socket.id);

    socket.on('broadcast', function (message) {
        logger.info('CSGOLotus broadcast > ' + JSON.stringify(message));
		
		// Now emit the data to the Steam Bot
		io.emit('gamedata', message);
    });
    socket.on('disconnect', function () {
        logger.info('Server > Disconnected socket ' + socket.id);
    });
});

server.listen(port);
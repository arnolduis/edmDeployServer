
/**
 * Module dependencies.
 */

 var express = require('express');
 var app = express();
 var io = require('socket.io').listen(server);
 var path = require('path');
 var fs    = require('fs');
 var nconf = require('nconf');
 var client = require('scp2');
 var favicon = require('serve-favicon');

 // var Connection = require('ssh2');


// all environments
app.use(favicon(__dirname + '/public/images/favicon.ico'));
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
	app.use(express.errorHandler());
}

// Testing if testAndApply commands are refering to existing fields
nconf.file({ file: 'config/config.json' });
var config = nconf.get();
var configOK = true;
for (var testCommand in config.testCommands) {
	if (!config.commands[config.testCommands[testCommand].test.command] ||
		!config.commands[config.testCommands[testCommand].command.command] ||
		!config.servers[config.testCommands[testCommand].test.server]) {
		console.log('Command config wrong');
		process.exit(1);
	}
	for (var i = 0; i < config.testCommands[testCommand].command.servers.length; i++) {
		if (!config.servers[config.testCommands[testCommand].command.servers[i]]) {
			console.log('Command config wrong');
			process.exit(1);
		}
	}
}

var server = app.listen(app.get('port'));
console.log('Express server listening on port ' + app.get('port'));

var io = require("socket.io")(server);

io.on('connection', function (socket) {
	console.log('user connected');
	socket.emit('news', { hello: 'world' });
	socket.on('message', function (data) {
		console.log(data);
	});
});

require('./routes')(app, io);




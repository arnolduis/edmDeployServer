
/**
 * Module dependencies.
 */

 var express = require('express');
 var routes = require('./routes');
 var user = require('./routes/user');
 var http = require('http');
 var path = require('path');
 var fs    = require('fs');
 var nconf = require('nconf');
 var client = require('scp2');
 var Connection = require('ssh2');

 var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.favicon());
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



nconf.argv().env().file({ file: './config/config.json' });

var commands = nconf.get("commands");
var servers = nconf.get("servers");
var privateKey = nconf.get("privateKey");


applyCommand('turdus','deploy');

function applyCommand (server, command) {

	var conn = new Connection();

	conn.on('ready', function() {

		if (Object.keys(commands[command]).length > 1) {

			console.log('==== Copying file and executing command');

			conn.sftp(function (err, sftp) {
				if (err) throw err;

				sftp.fastPut(commands[command].file, commands[command].path, {}, function (err) {

					console.log(err ? "Could not deploy. " : "File sent, executing command...");

					conn.exec(commands[command].command, function(err, stream) {
						if (err) throw err;
						stream.on('exit', function(code, signal) {
							// console.log('Stream :: exit :: code: ' + code + ', signal: ' + signal);
						}).on('close', function() {
							// console.log('Stream :: close');
							conn.end();
						}).on('data', function(data) {
							console.log('==== COMMAND OUTPUT: \n' + data + '\n');
						}).stderr.on('data', function(data) {
							console.log('==== COMMAND ERROR: \n' + data + '\n');
						});
					});
				});
			});	

		} else {

			console.log('==== Executing command');

			conn.exec(commands[command].command, function(err, stream) {
				if (err) throw err;
				stream.on('exit', function(code, signal) {
					// console.log('Stream :: exit :: code: ' + code + ', signal: ' + signal);
				}).on('close', function() {
					// console.log('Stream :: close');
					conn.end();
				}).on('data', function(data) {
					console.log('==== COMMAND OUTPUT: \n' + data + '\n');
				}).stderr.on('data', function(data) {
					console.log('==== COMMAND ERROR: \n' + data + '\n');
				});
			});
		}

	}).connect({
		host: servers[server].host,
		port: servers[server].port,
		username: servers[server].username,
		privateKey: fs.readFileSync(privateKey),
	});
}


// http.createServer(app).listen(app.get('port'), function(){
	console.log('Express server listening on port ' + app.get('port'));
// });

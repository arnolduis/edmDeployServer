
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
 // var Connection = require('ssh2');


// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
// app.use(express.favicon());
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

require('./routes')(app);


io.on('çonnection', function (socket) {
	console.log('a User connected');
});



// applyCommand('turdus','deploy');








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

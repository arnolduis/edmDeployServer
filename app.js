
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var http = require('http');
var path = require('path');

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

app.get('/', routes.index);
app.get('/users', user.list);






var client = require('scp2');

client.scp('test.txt', {
  host: 'turdus.itk.ppke.hu',
  port: 22,
  username: 'ferar',
  privateKey: require('fs').readFileSync('C://cygwin64/home/arnolduis/.ssh/id_dsa'),
  path: '/home/ferar/'
}, function(err) {


	var Connection = require('ssh2');

	var conn = new Connection();
	conn.on('ready', function() {
	  console.log('Connection :: ready');
	  conn.exec('tail test.txt', function(err, stream) {
	    if (err) throw err;
	    stream.on('exit', function(code, signal) {
	      console.log('Stream :: exit :: code: ' + code + ', signal: ' + signal);
	    }).on('close', function() {
	      console.log('Stream :: close');
	      conn.end();
	    }).on('data', function(data) {
	      console.log('STDOUT: ' + data);
	    }).stderr.on('data', function(data) {
	      console.log('STDERR: ' + data);
	    });
	  });
	}).connect({
	  host: 'turdus.itk.ppke.hu',
	  port: 22,
	  username: 'ferar',
	  privateKey: require('fs').readFileSync('C://cygwin64/home/arnolduis/.ssh/id_dsa')
	});
	
});










// http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
// });

var fs = require('fs');
var Connection = require('ssh2');
var nconf = require('nconf');
nconf.file({ file: 'config/config.json' });
var privateKey = nconf.get("privateKey");
var async = require('async');


module.exports = function (app, io) {


	app.post('/commands/getFile', function (req, res) {
		fs.readFile(req.body.file, 'utf8', function (err, result) {
			if (err) return console.log(err);
			res.send({"file": result});
		});
	});


	app.post('/commands/saveAndApply', function (req, res) {

		console.log(req.body);

		saveCmd(req);
		var server = nconf.get('servers:'+ req.body.server);
		console.log('XXXXX');
		
		var conn = new Connection();
		var exitcode = null;

		conn.on('ready', function() {

			console.log(
				req.body.file 
				? '==== Copying file and executing command ====' 
				: '==== Executing command ===='
			);

		    async.series([
		    	sendFile(req, conn),
		    	sendCmd(req, conn)
		    ]);



		}).on('error', function (err) {
			console.log(err);
		}).connect({
		    host: server.host,
		    port: server.port,
		    username: server.username,
		    privateKey: fs.readFileSync(privateKey),
		});





		function saveCmd () {
			if (req.body.commandData) {
				nconf.set("commands:" + req.body.command, req.body.commandData);
				nconf.save(function (err) {
				  fs.readFile('config/config.json', function (err, data) {
				  	if (err) console.log(err);
				  });
				});
			}
			
			if (req.body.file) {
				fs.writeFileSync(req.body.commandData.file, req.body.file);
			}
		}

		function sendFile () {
			if (req.body.file) {
		        conn.sftp(function (err, sftp) {
		            if (err) throw err;
		            sftp.fastPut(req.body.file, req.body.commandData.path, {}, function (err) {
		                console.log(err ? "Could not send File. " : "File sent, executing command...");
		            });
		        }); 
			}
		}

		function sendCmd () {
	        conn.exec(req.body.commandData.command, function(err, stream) {
	        	if (err) throw err;
	        	stream.on('exit', function(code, signal) {
	        		console.log('Stream :: exit :: code: ' + code + ', signal: ' + signal);
	        		exitcode = code;
	        	}).on('close', function() {
	        		console.log('Stream :: close');
	    			io.emit('stdout', { name: req.body.server, output: "\n" } );
	        		conn.end();
	            	res.send({ code: exitcode });
	        	}).on('data', function(data) {
	        		console.log('STDOUT: ' + data);
	    			io.emit('stdout', { name: req.body.server, output: data.toString() } );
	        	}).stderr.on('data', function(data) {
	        		console.log('STDERR: ' + data);
	        	});
	        });
		}
	});
};
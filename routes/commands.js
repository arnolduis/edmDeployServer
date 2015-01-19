var fs = require('fs');
var Connection = require('ssh2');
var nconf = require('nconf');
nconf.file({ file: 'config/config.json' });
var privateKey = nconf.get("privateKey");


module.exports = function (app, io) {


	app.post('/commands/getFile', function (req, res) {
		fs.readFile(req.body.file, 'utf8', function (err, result) {
			if (err) return console.log(err);
			res.send({"file": result});
		});
	});

	app.post('/commands/saveAndApply', function (req, res) {
		console.log(req.body);

		nconf.set("commands:" + req.body.command.name, req.body.command.value);
		nconf.save(function (err) {
		  fs.readFile('config/config.json', function (err, data) {
		  	if (err) console.log(err);
		  });
		});

		if (req.body.command.value.file) {
			fs.writeFileSync(req.body.command.value.file, req.body.file);
		}
		
		var conn = new Connection();

		var exitcode = null;

		conn.on('ready', function() {

		    if (Object.keys(req.body.command.value).length > 1) {

		    	console.log(req.body.file);

		        console.log('==== Copying file and executing command ====');

		        conn.sftp(function (err, sftp) {
		            if (err) throw err;

		            sftp.fastPut(req.body.command.value.file, req.body.command.value.path, {}, function (err) {

		                console.log(err ? "Could not deploy. " : "File sent, executing command...");

            	        conn.exec(req.body.command.value.command, function(err, stream) {
            	        	if (err) throw err;
            	        	stream.on('exit', function(code, signal) {
            	        		console.log('Stream :: exit :: code: ' + code + ', signal: ' + signal);
            	        		exitcode = code;
            	        	}).on('close', function() {
            	        		console.log('Stream :: close');
		            			io.emit('stdout', { name: req.body.server.name, output: "\n" } );
            	        		conn.end();
			                	res.send({ code: exitcode });
            	        	}).on('data', function(data) {
            	        		console.log('STDOUT: ' + data);
		            			io.emit('stdout', { name: req.body.server.name, output: data.toString() } );
            	        	}).stderr.on('data', function(data) {
            	        		console.log('STDERR: ' + data);
            	        	});
            	        });
		            });
		        }); 

		    } else {

		        console.log('==== Executing command ====');

    	        conn.exec(req.body.command.value.command, function(err, stream) {
    	        	if (err) throw err;
    	        	stream.on('exit', function(code, signal) {
    	        		console.log('Stream :: exit :: code: ' + code + ', signal: ' + signal);
    	        		exitcode = code;
    	        	}).on('close', function() {
    	        		console.log('Stream :: close');
		            	io.emit('stdout', { name: req.body.server.name, output: "\n" } );
    	        		conn.end();
	                	res.send({ code: exitcode });
    	        	}).on('data', function(data) {
    	        		console.log('STDOUT: ' + data);
            			io.emit('stdout', { name: req.body.server.name, output: data.toString() } );
    	        	}).stderr.on('data', function(data) {
    	        		console.log('STDERR: ' + data);
    	        	});
    	        });
		    }

		}).on('error', function (err) {
			console.log(err);
		}).connect({
		    host: req.body.server.value.host,
		    port: req.body.server.value.port,
		    username: req.body.server.value.username,
		    privateKey: fs.readFileSync(privateKey),
		});
	});
};
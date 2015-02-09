var fs = require('fs');
var Connection = require('ssh2');
var nconf = require('nconf');
nconf.file({ file: 'config/config.json' });
var async = require('async');


module.exports = function (app, io) {


	app.post('/commands/getFile', function (req, res) {
		fs.readFile(req.body.file, 'utf8', function (err, result) {
			if (err) return console.log(err);
			res.send({"file": result});
		});
	});

	app.post('/commands/testCommand', function (req, res) {
		var testCommand = nconf.get('testCommands:' + req.body.command);
		var command = nconf.get('commands:' + testCommand.command.command);
		var commandServers = [];
		for (var i = 0; i < testCommand.command.servers.length; i++) {
			commandServers.push(nconf.get('servers:' + testCommand.command.servers[i]));
		}
		var test = nconf.get('commands:' + testCommand.test.command);
		var testServer = nconf.get('servers:' + testCommand.test.server);
		var testexitcode = null;
	    var exitcodes = {};
		var conn = new Connection();

		conn.on('ready', function() {
	        conn.exec(test.command, function(err, stream) {
	        	if (err) throw err;
	        	stream.on('exit', function(code, signal) {
	        		console.log('Stream :: exit :: code: ' + code + ', signal: ' + signal);
	        		testexitcode = code;
	        	}).on('close', function() {
	        		console.log('Stream :: close');
	    			io.emit('stdout', { name: testServer.name, output: "\n" } );
	        		conn.end();
	        		if (testexitcode) {
	        			res.send({err: 'Test failed....'});
	        		}
	        		else {
						// for (var i = 0; i < commandServers.length; i++) {
						// 	(function (i) {
						// 		var commandConn = new Connection();
						// 		commandConn.on('ready', function() {
				  //   		        commandConn.exec(command.command, function(err, stream) {
				  //   		        	if (err) throw err;
				  //   		        	stream.on('exit', function(code, signal) {
				  //   		        		console.log('Stream :: exit :: code: ' + code + ', signal: ' + signal);
				  //   		    			io.emit('stdout', { name: commandServers[i].name, output: "\n" } );
				  //   		        		exitcode = code;
				  //   		        	}).on('close', function(data) {
				  //   		        		console.log('Stream :: close');
				  //   		        		commandConn.end();
					 //                        res.send({exitcode: exitcode});
				  //   		        	}).on('data', function(data) {
				  //   		        		console.log('STDOUT: ' + data);
				  //   		    			io.emit('stdout', { name: commandServers[i].name, output: data.toString() } );
				  //   		        	}).stderr.on('data', function(data) {
				  //   		        		console.log('STDERR: ' + data);
				  //   		        	});
				  //   		        });
				  //   		    }).connect({
				  //   		        host: commandServers[i].host,
				  //   		        port: commandServers[i].port,
				  //   		        username: commandServers[i].username,
				  //   		        privateKey: fs.readFileSync(commandServers[i].privateKey),
				  //   		    });
						// 	})(i);
						// }


	        			async.each(commandServers, function (server, callback) {
	        				var conn = new Connection();
	        				var message = null;
							conn.on('ready', function() {
			    		        conn.exec(command.command, function(err, stream) {
			    		        	if (err) throw err;
			    		        	stream.on('exit', function(code, signal) {
			    		        		console.log('Stream :: exit :: code: ' + code + ', signal: ' + signal);
			    		    			io.emit('stdout', { name: server.name, output: "\n" } );
			    		        		if (code) {
			    		        			message = {err: 'Error, ' + exitcodes[server.name] + 'failed.'};
			    		        		}
			    		        	}).on('close', function(data) {
		    		        			conn.end();
			    		        		console.log('Stream :: close');
			    		        		if (message) callback(1);
			    		        		callback();
			    		        	}).on('data', function(data) {
			    		        		console.log('STDOUT: ' + data);
			    		    			io.emit('stdout', { name: server.name, output: data.toString() } );
			    		        	}).stderr.on('data', function(data) {
			    		        		console.log('STDERR: ' + data);
			    		        	});
			    		        });
			    		    }).connect({
			    		        host: server.host,
			    		        port: server.port,
			    		        username: server.username,
			    		        privateKey: fs.readFileSync(server.privateKey),
			    		    });
	        			}, function (err, message) {
	        				if (err) res.send(	message ); 
	        				res.send({output: 'Deploy worked'});
	        			});
	        		}
	        	}).on('data', function(data) {
	        		console.log('STDOUT: ' + data);
	    			io.emit('stdout', { name: testServer.name, output: data.toString() } );
	        	}).stderr.on('data', function(data) {
	        		console.log('STDERR: ' + data);
	        	});
	        });
		}).connect({
		    host: testServer.host,
		    port: testServer.port,
		    username: testServer.username,
		    privateKey: fs.readFileSync(testServer.privateKey),
		});
	});

	app.post('/commands/saveAndApply', function (req, res) {

		var conn = new Connection();
		var exitcode = null;
		var command = req.body.command;
		var file = req.body.file || null;
		var servers = req.body.servers;	

		saveCmd(command, file);

		for (var i = 0; i < servers.length; i++) {
			(function (i) {
				
				conn.on('ready', function() {

					console.log(
						file ?
						'==== Copying file and executing command ====' :
						'==== Executing command ===='
					);

			    	if (command.file) {
    			        conn.sftp(function (err, sftp) {
    			            if (err) throw err;
    			            sftp.fastPut(command.file, command.path, {}, function (err) {
    			                console.log(err ? err : "File sent, executing command...");
		                        conn.exec(command.command, function(err, stream) {
		                        	if (err) throw err;
		                        	stream.on('exit', function(code, signal) {
		                        		console.log('Stream :: exit :: code: ' + code + ', signal: ' + signal);
		                        		exitcode = code;
		                        	}).on('close', function() {
		                        		console.log('Stream :: close');
		                    			io.emit('stdout', { name: servers[i].name, output: "\n" } );
		                        		conn.end();
		                        		res.send({exitcode: exitcode});
		                        	}).on('data', function(data) {
		                        		console.log('STDOUT: ' + data);
		                    			io.emit('stdout', { name: servers[i].name, output: data.toString() } );
		                        	}).stderr.on('data', function(data) {
		                        		console.log('STDERR: ' + data);
		                        	});
		                        });
    			            });
    			        }); 
			    	}
			    	else {
	    		        conn.exec(command.command, function(err, stream) {
	    		        	if (err) throw err;
	    		        	stream.on('exit', function(code, signal) {
	    		        		console.log('Stream :: exit :: code: ' + code + ', signal: ' + signal);
	    		    			io.emit('stdout', { name: servers[i].name, output: "\n" } );
	    		        		
	    		        		exitcode = code;
	    		        	}).on('close', function(data) {
	    		        		console.log('Stream :: close');
	    		        		conn.end();
		                        res.send({exitcode: exitcode});
	    		        	}).on('data', function(data) {
	    		        		console.log('STDOUT: ' + data);
	    		    			io.emit('stdout', { name: servers[i].name, output: data.toString() } );
	    		        	}).stderr.on('data', function(data) {
	    		        		console.log('STDERR: ' + data);
	    		        	});
	    		        });
			    	}



				}).on('error', function (err) {
					console.log(err);
				}).connect({
				    host: servers[i].host,
				    port: servers[i].port,
				    username: servers[i].username,
				    privateKey: fs.readFileSync(servers[i].privateKey),
				});
			})(i);
		}
	});

	function saveCmd (command, file) {
		if (command.path) {
			nconf.set("commands:" + command.name, command);
			nconf.save(function (err) {
			  fs.readFile('config/config.json', function (err, data) {
			  	if (err) console.log(err);
			  });
			});
			if (file) {
				fs.writeFileSync(command.file, file);
			}
		}
	}

// 	function sendFile (conn, server, command, callback) {
// 		if (command.file) {
// 	        conn.sftp(function (err, sftp) {
// 	            if (err) throw err;
// 	            sftp.fastPut(command.file, command.path, {}, function (err) {
// 	                console.log(err ? err : "File sent, executing command...");
// console.log('lefutottan');
// 					callback(conn, server, command, function () {});
// 	            });
// 	        }); 
// 		}
// 	}

// 	function sendCmd (conn, server, command, callback) {
//         conn.exec(command.command, function(err, stream) {
//         	if (err) throw err;
//         	stream.on('exit', function(code, signal) {
//         		console.log('Stream :: exit :: code: ' + code + ', signal: ' + signal);
//         		exitcode = code;
//         	}).on('close', function() {
//         		console.log('Stream :: close');
//     			io.emit('stdout', { name: server.name, output: "\n" } );
//         		conn.end();
//         		callback(null);
//         	}).on('data', function(data) {
//         		console.log('STDOUT: ' + data);
//     			io.emit('stdout', { name: server.name, output: data.toString() } );
//         	}).stderr.on('data', function(data) {
//         		console.log('STDERR: ' + data);
//         	});
//         });
// 	}

// 	function connectAndExecute (server, command, file, callback) {
// 		var commandData = nconf.get('commands:' + command);
// 		var serverData = nconf.get('servers:' + server);
// 		var conn = new Connection();
// 		var exitcode = null;

// 		conn.on('ready', function() {

// 			async.series([
// 				function (callback) {
// 					conn.exec(command.command, function(err, stream) {
// 						if (err) throw err;
// 						stream.on('exit', function(code, signal) {
// 							console.log('Stream :: exit :: code: ' + code + ', signal: ' + signal);
// 							exitcode = code;
// 						}).on('close', function() {
// 							console.log('Stream :: close');
// 							io.emit('stdout', { name: server, output: "\n" } );
// 							conn.end();
// 							callback(null, exitcode);
// 						}).on('data', function(data) {
// 							console.log('STDOUT: ' + data);
// 							io.emit('stdout', { name: server, output: data.toString() } );
// 						}).stderr.on('data', function(data) {
// 							console.log('STDERR: ' + data);
// 						});
// 					});
// 				},
// 				function (exitcode, callback) {
					
// 				}
// 			]);
// 			console.log('ExitCOde: ' + exitcode);

// 		}).on('error', function (err) {
// 			console.log(err);
// 		}).connect({
// 		    host: serverData.host,
// 		    port: serverData.port,
// 		    username: serverData.username,
// 		    privateKey: fs.readFileSync(serverData.privateKey),
// 		});
// 	}
};
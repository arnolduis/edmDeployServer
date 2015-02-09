module.exports = function(app) {

	app.get("/homeVM.js", function (req,res) {
		var fs = require('fs');
		var nconf = require('nconf');

		nconf.argv().env().file({ file: 'config/config.json' });

		var commands = nconf.get("commands");
		var servers = nconf.get("servers");

		fs.readFile('viewmodels/homeVM.js', 'utf8', function (err,result) {
			if (err) console.log(err);

			result = result.replace(/%servers%/g, JSON.stringify(toArray(servers)));
			result = result.replace(/%commands%/g, JSON.stringify(toArray(commands)));
	        res.send(result);
		});
	});	

	function toArray (jsonObject) {
		var buff = [];
		for (var i in jsonObject) {
			buff.push(jsonObject[i]);
		}
		return buff;
	}
};
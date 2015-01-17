  // routes/index.js
var fs = require('fs');
var validFileTypes = ['js'];
var path = require('path');

 
var requireFiles = function (directory, app, io) {
  fs.readdirSync(directory).forEach(function (fileName) {
    // Recurse if directory
    var target = path.join(directory, fileName);

    if(fs.lstatSync(target).isDirectory()) {
      requireFiles(target, app, io);
    } else {
 
      // Skip this file
      if(fileName === 'index.js' && directory === __dirname) return;
 
      // Skip unknown filetypes
      if(validFileTypes.indexOf(fileName.split('.').pop()) === -1) return;
 
      // Require the file.
      require(target)(app, io);
    }
  });
};
 
module.exports = function (app, io) {
  requireFiles(__dirname, app, io);
};
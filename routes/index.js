  // routes/index.js
var fs = require('fs'),
    validFileTypes = ['js'];
var path = require('path');


 
var requireFiles = function (directory, app) {
  fs.readdirSync(directory).forEach(function (fileName) {
    // Recurse if directory
    var target = path.join(directory, fileName);

    if(fs.lstatSync(target).isDirectory()) {
      requireFiles(target, app);
    } else {
 
      // Skip this file
      if(fileName === 'index.js' && directory === __dirname) return;
 
      // Skip unknown filetypes
      if(validFileTypes.indexOf(fileName.split('.').pop()) === -1) return;
 
      // Require the file.
      require(target)(app);
    }
  });
};
 
module.exports = function (app) {
  requireFiles(__dirname, app);
};
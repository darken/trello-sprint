var fs = require('fs'),
    path = require('path');

var ENCODING = 'utf-8';

function JSONProvider(dirPath, name) {
  this.record = null;
  this.filePath = path.join(dirPath, name + '.json');
}

JSONProvider.prototype.write = function (cb) {
  fs.writeFile(this.filePath, JSON.stringify(this.record, null, 2), ENCODING, cb);
}

JSONProvider.prototype.read = function (cb) {
  var that = this;
  path.exists(that.filePath, function (exists) {
    if (!exists) {
      that.record = null;
      cb(null, that.record);
      return;
    }

    fs.readFile(that.filePath, ENCODING, function (err, data) {
      if (err) cb(err);
      that.record = JSON.parse(data);

      cb(null, that.record);
    });
  });
}

exports = module.exports = JSONProvider;

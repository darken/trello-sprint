var request = require('request');

function downloadFile(url, cb) {
  console.log('\nDownloading file');
  var fileRequest = request(url, function (err, res, body) {
    if (err) cb(err);

    var statusCode = res.statusCode;
    if (200 !== statusCode) {
      cb('Response status code ' + statusCode);
    }
  });

  var fileData = '';
  fileRequest.encoding = 'binary';
  fileRequest.on('data', function (chunk) {
    fileData += chunk;
  });

  fileRequest.on('end', function () {
    console.log('Download complete\n');
    cb(null, fileData);
  });
}

exports.downloadFile = downloadFile;
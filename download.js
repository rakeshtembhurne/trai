var http = require('http');
var fs = require('fs');
var _ = require("underscore");
var async   = require("async");

var download = function(url, dest, cb) {
  var file = fs.createWriteStream(dest);
  var request = http.get(url, function(response) {
    response.pipe(file);
    file.on('finish', function() {
      file.close(cb);  // close() is async, call cb after close completes.
    });
  }).on('error', function(err) { // Handle errors
    fs.unlink(dest); // Delete the file async. (But we don't check the result)
    if (cb) cb(err.message);
  });  
};


var traiUrls = [
    // 'http://localhost/trai/example.html',
    'http://trai.gov.in/Comments/OLD/27-Mar=to-10-Apr/27-mar.html',
    'http://trai.gov.in/Comments/11-APRIL/11-April.html',
    'http://www.trai.gov.in/Comments/12-April/12-April-p2/12-April-p2.html',
    'http://www.trai.gov.in/Comments/13-April/html-13/13-April/p1/13-April.html',
    'http://www.trai.gov.in/Comments/14-April-1/14-April-1.html',
    'http://www.trai.gov.in/Comments/14-April-2/14-April-2.html',
    'http://www.trai.gov.in/Comments/14-April-3/14-April-3.html',
    'http://www.trai.gov.in/Comments/14-April-4/14-April-4.html',
    'http://www.trai.gov.in/Comments/16-April/16-April/16-April.html',
    'http://www.trai.gov.in/Comments/16-April/16-April-p2/16-April-p2.html',
    'http://trai.gov.in/Comments/17-April/17-April.html',
    'http://trai.gov.in/Comments/18-April/18-April.html',
    'http://trai.gov.in/Comments/19-April/19-April.html',
    'http://trai.gov.in/comments/20-April/20-April.html',
    'http://www.trai.gov.in/Comments/21-April/21-April.html',
    'http://www.trai.gov.in/Comments/22-April/22-April.html',
    'http://trai.gov.in/comments/OLD/23-April/23-April.html',
    'http://trai.gov.in/comments/24-April/24-April.html'
];

async.eachSeries(traiUrls, function(url, callback) {
    var filename = url.substring(url.lastIndexOf('/')+1);
    console.log(filename);
    download(url, filename, callback);
});
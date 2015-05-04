var cheerio = require("cheerio");
var request = require("request");
var mysql   = require("mysql");
var async   = require("async");
var colors  = require("colors");
var fs      = require('fs');
var http    = require('http');

var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : 'root',
  database : 'trai'
});
connection.connect();

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

var rowCount = 1000;

var validName = function(name) {
    name = name.replace(/[^a-zA-Z0-9\s\d]/g, '');
    return name.trim();
};
var validEmail = function(email) {
    email = email.replace(/[^a-zA-Z0-9@\(\)\_\-\.]/g, '');
    email = email.replace('(at)', '@');
    email = email.replace('(dot)', '.');
    return email;
};
var saveToDatabase = function(sql, rowCount, callback) {
    connection.query(sql, function(err, rows, fields) {
        if (err) throw err;
        console.log("Successfully added".green, rowCount, " rows".green);
        if (callback) callback();
    });
};

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

var processFiles = function() {
    async.eachSeries(traiUrls, function(url, callback) {
        var rowCount = 1000;
        console.log("==========", url, "==========");
        var filename = url.substring(url.lastIndexOf('/')+1);
        // var $ = cheerio.load(body);
        var $ = cheerio.load(fs.readFileSync(filename));

        var sqlCount = 0;
        var sqlQuery = "INSERT INTO `users` (`name`, `email`) VALUES ";
        $('tr').map(function(i, el) {
            if (sqlCount >= 1000) {
                sqlQuery = sqlQuery.replace(/,\s*$/, "");
                saveToDatabase(sqlQuery, rowCount);
                sqlQuery = "INSERT INTO `users` (`name`, `email`) VALUES ";
                sqlCount = 0;
                rowCount += 1000;
            };
            sqlCount++;
            var nameEmail = $(this).children("td").first().next().text();
            var match     = nameEmail.match(/(.*)<(.*\(at\).*(\(dot\))?.*)>?/);
            if (match) {
                sqlQuery += " ('"+validName(match[1])+"', '"+validEmail(match[2])+"'), ";
            } else {
                var match = nameEmail.match(/(.*\(at\).*(\(dot\))?.*)/);
                if (match) {
                    sqlQuery += " ('', '"+validEmail(match[1])+"'), ";
                } else {
                    console.log("Will not be saved: ".red, nameEmail);
                }
            } 
        });

        sqlQuery = sqlQuery.replace(/,\s*$/, "");
        saveToDatabase(sqlQuery, rowCount, callback);        
        
    }, function(error) {
        console.log("All urls are done, exiting now");
        process.exit(0);
    });
};

async.eachSeries(traiUrls, function(url, callback) {
    var filename = url.substring(url.lastIndexOf('/')+1);
    console.log(filename);
    download(url, filename, callback);
}, function(error) {
    processFiles();    
});

//http://trai.gov.in/Comments/Comments-List003.pdf
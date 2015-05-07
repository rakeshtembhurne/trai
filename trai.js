var LineByLineReader = require('line-by-line');    

var cheerio = require("cheerio");
var request = require("request");
var mysql   = require("mysql");
var colors  = require("colors");
var async   = require("async");
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
var saveToDatabase = function(sql, user, cb) {
    connection.query(sql, function(err, rows, fields) {
        if (err) {
            console.log(sql);
            throw err;
        }
        console.log("Successfully added".green, user);   
        cb();     
    });
};

var download = function(url, dest, cb) {
    var file    = fs.createWriteStream(dest);
    var request = http.get(url, function(response) {
        response.pipe(file);
        file.on('finish', function() {
            console.log('Finished downloading '.yellow, url.yellow);
            file.close(cb);
        });
    }).on('error', function(err) {
        fs.unlink(dest);
        if (cb) cb(err.message);
    });  
};

var processFiles = function() {
    async.eachSeries(traiUrls, function(url, callback) {
        var filename = url.substring(url.lastIndexOf('/')+1);
        var lr       = new LineByLineReader(filename);

        lr.on('line', function (line) {
            var $          = cheerio.load(line);
            var nameEmail  = $("td").text().trim();
            var didMatched = false;
            var user = {name: '', email: ''};
            var match = nameEmail.match(/(advqos)/);
            if (!match) {
                var match = nameEmail.match(/(.*)<(.*\(at\).*(\(dot\))?.*)>?/);
                if (match) {
                    user.name  = validName(match[1]);
                    user.email = validEmail(match[2]);            
                    didMatched = true;
                } else {
                    var match = nameEmail.match(/(.*\(at\).*(\(dot\))?.*)/);
                    if (match) user.email = validEmail(match[1]);
                }
            }

            if (didMatched) {
                var sqlQuery = "INSERT INTO `users` (`name`, `email`) VALUES ";
                sqlQuery += " ('"+user.name+"', '"+user.email+"')";            
                saveToDatabase(sqlQuery, user, callback);
            }
        });

        lr.on('error', function (err) {
            console.log(err);
            callback();
        });
        lr.on('end', function () {
            console.log("file has ended");
            callback();
        });
    });
}

async.eachSeries(traiUrls, function(url, callback) {
    var filename = url.substring(url.lastIndexOf('/')+1);
    console.log('Downloading '.yellow, filename.yellow);
    download(url, filename, callback);
}, function(error) {
    processFiles();    
});
var cheerio = require("cheerio");
var request = require("request");
var mysql   = require('mysql');
var _       = require('underscore');

var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : 'root',
  database : 'trai'
});
connection.connect();

var traiUrls = [
    'http://trai.gov.in/Comments/OLD/27-Mar=to-10-Apr/27-mar.html',
    // 'http://trai.gov.in/Comments/11-APRIL/11-April.html',
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

var getEmails = function(url) {
    request(url, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            var $ = cheerio.load(body);
            $('tr').map(function(i, el) {
                var nameEmail = $(this).children("td").first().next().text();
                var match = nameEmail.match(/(.*)<(.*\(at\).*(\(dot\))?.*)>/);
                if (match) {
                    var user = {
                        name: validName(match[1]),
                        email: validEmail(match[2])
                    };                    
                    saveToDatabase(user);
                } else {
                    var match = nameEmail.match(/(.*\(at\).*(\(dot\))?.*)/);
                    if (match) {
                        var user = {
                            name: '',
                            email: validEmail(match[1])
                        };
                        saveToDatabase(user);
                    } else {
                        console.log("Not saved: ", nameEmail);
                    }
                } 
                console.log('---------');
            });
        }
    });
};
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
var saveToDatabase = function(user) {
    var sql = "INSERT INTO users SET name='"+user.name+"', email='"+user.email+"'";
    console.log("saved", user);
    connection.query(sql, function(err, rows, fields) {
        if (err) throw err;
        console.log("Successfully added", user);                                        
    });
};
_.each(traiUrls, function(url){
    console.log("===========", url, "===========");
    getEmails(url);
});

//http://trai.gov.in/Comments/Comments-List003.pdf
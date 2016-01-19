//
// # Crawler
//

var $ = require('cheerio');
var req = require('request');
var URL = require('./modules/urlHandler');
var dbInterface = require('./modules/CRUD');

var options = {
    url : 'http://onetouchbinaryoptions.com/',
    method : 'GET'
};

var crawlerActive = true; //flag to manipulate crawler's state /started/ or /stoped/

function startCrawl() {
    if(crawlerActive) {
        req(options, function(err, response, body) {
            if(err) console.log(err.message);
            var html  = $.load(body);
            html('a').each(function() {
                //check type of each anchor url from body
                var urlType = URL.urlType(this.attribs.href, options.url);
                if(urlType === 'external') {
                    console.log('found an external link:' + this.attribs.href);
                    
                    dbInterface.insertExpired(this.attribs.href);
                }
                else {
                    console.log('internal');
                }
            });
        });  
    }
}

function start() {
    dbInterface.init(startCrawl);    
}


start();
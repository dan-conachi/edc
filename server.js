//
// # Crawler
//

var $ = require('cheerio');
var req = require('request');
var URL = require('./modules/urlHandler');
var dbInterface = require('./modules/CRUD');

//url property is the starting crawling point (should be without trailing slash '/' at the end for now!)
//uses MongoDB for storing internal and external URLs :) t.e can crawl huge websites with > 100K urls!

var options = {
    url : 'http://binaryoptionplace.com',
    method : 'GET'
};

var crawlerActive = true; //flag to manipulate crawler's state /started/ or /stoped/

function crawl(options) {
    //crawlerActive is a flag to manage stop start crawler
    if(crawlerActive) {
        req(options, function(err, response, body) {
            if(err) console.log(err.message);
            var html  = $.load(body);
            html('a').each(function() {
                URL.manageUrl(this.attribs.href, options.url);
            });
            dbInterface.updateCrawledUrl(options.url, function() {
               //prepare the next url to be crawled
                dbInterface.getNextRecord(options.url, function(record) {
                    if(!record) { //if result null then end crawl
                        console.log('crawl ended because result = ' + record);
                        dbInterface.rebuildInternalCollection(function() {
                          //insert here the new domain to be crawled

                        });
                        return;
                    }
                    options.url = record.url;
                    //manage crawlerActive flag before the recursion is called
                    //recursion here!!!
                    console.log('crawling now ' + options.url);
                    crawl(options);
                });
            });
        });
    }
    else { //stop recursion
        return;
    }
}

function start() {
    dbInterface.init(options, crawl);
}

//here is where the crawl starts!
start();

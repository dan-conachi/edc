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
    url : 'http://internetvikings.com',
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
            dbInterface.updateInternalCrawledUrl(options.url, function() {
               //prepare the next url to be crawled
               var slug = URL.getSlug(options.url);
               //check is we crawl the home page 
               if(!slug || slug === '/') {
                 slug = options.url;
               }
               console.log('options.url tuk e : ' + options.url);
               console.log('sluga tuk e : ' + slug);
               //internal url is retrived from the collection by the slug
                dbInterface.getNextInternalRecord(slug, function(err, record) {
                    if(!record) { //if result null then end crawl
                        console.log('crawl ended because result = ' + record);
                        dbInterface.rebuildInternalCollection(function() {
                          //insert here the new domain to be crawled
                          var domain = URL.getDomainName(options.url);
                          dbInterface.updateSourceCrawledDomain(domain, function() {
                            dbInterface.getNextSourceDomain(domain, function(err, data) {
                              console.log('getNextSourceDomain vryshta data.url : ' + data.url);
                              options.url = data.url;
                              crawl(options);
                            });
                          });
                        });
                        return;
                    }
                    options.url = record.url;
                    //manage crawlerActive flag before the recursion is called
                    //recursion here!!!
                    crawl(options);
                });
            });
        });
    }
    else { //stop recursion
        return;
    }
}

function start(options) {
    dbInterface.init(options, crawl);
}

//here is where the crawl starts!
start(options);

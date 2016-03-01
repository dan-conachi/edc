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
    url : 'https://www.reddit.com/',
    method : 'GET'
};

var crawlerActive = true; //flag to manipulate crawler's state /started/ or /stoped/

function crawl(options) {
    //crawlerActive is a flag to manage stop start crawler
    if(!crawlerActive) return;
    console.log('crawl link now: ' + options.url);
    req(options, function(err, response, body) {
        if(err) console.log(err.message);
        var html  = $.load(body);
        //iterate on each anchor from body
        html('a').each(function() {
            URL.manageUrl(this.attribs.href, options.url);
        });
        dbInterface.updateInternalCrawledUrl(options.url, function() {
           //prepare the next url to be crawled
           console.log('updateing url' + options.url);
           var slug = URL.getSlug(options.url);
           //check is we crawl the home page
           if(!slug || slug === '/') {
             slug = options.url;
           }
           //internal url is retrived from the collection by the slug
            dbInterface.getNextInternalRecord(slug, function(err, record) {
                if(!record) { //if result null then end crawl
                    console.log('couldnt get next record for this slug ' + slug);
                    return;
                    dbInterface.rebuildInternalCollection(function(err, res) {
                      //insert here the new domain to be crawled
                      var domain = URL.getDomainName(options.url);
                      dbInterface.updateSourceCrawledDomain(domain, function() {
                        dbInterface.getNextSourceDomain(domain, function(err, data) {
                          options.url = data.url;
                          dbInterface.insertInternalUrl(options.url, function(err, res) {
                              crawl(options);
                          });
                        });
                      });
                    });
                }
                else {
                  options.url = record.url;
                  //manage crawlerActive flag before the recursion is called
                  //recursion here!!!
                  crawl(options);
                }
            });
        });
    });
}

function start(options) {
    dbInterface.init(options, crawl);
}

//here is where the crawl starts!
start(options);

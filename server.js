//
// # Crawler
//

var $ = require('cheerio');
var req = require('request');
var URL = require('./modules/urlHandler');
var dbInterface = require('./modules/CRUD');
var crawlObj = require('./modules/CRUD').crawlObj;

//url property is the starting crawling point (should be without trailing slash '/' at the end for now!)
//uses MongoDB for storing internal and external URLs :) t.e can crawl huge websites with > 100K urls!

var crawlerActive = true; //flag to manipulate crawler's state /started/ or /stoped/

//initialize crawl object
function init() {
  dbInterface.init(function(err, data) {
    crawl(data);
  });
}

function rebuildInternalCollectionCb(err, data) {
  //insert here the new domain to be crawled
  //var domain = URL.getDomainName(options.url);
  dbInterface.updateSourceCrawledDomain(crawlObj.currentDomainId, function() {
    dbInterface.getNextSourceDomain(crawlObj.currentDomainId, function(err, data) {
      crawlObj.currentDomainId = data._id;
      crawlObj.domainName = data.url;
      dbInterface.insertInternalUrl(crawlObj.domainName, function(err, res) {
        crawlerActive = true;
        crawl(crawlObj.request);
      });
    });
  });
}

function crawl(options) {
    //crawlerActive is a flag to manage stop/start crawler
    if(!crawlerActive) return;
    req(options, function(err, response, body) {
        if(err) console.log(err.message);
        var html  = $.load(body);
        //iterate on each anchor from body
        html('a').each(function() {
            URL.manageUrl(this.attribs.href, crawlObj.domainName, function(err, data) {
              if(err && err.message === 'quota exceeded') { //rebuild internals collection in case quote exceeded!
                crawlerActive = false;
                dbInterface.rebuildInternalCollection(rebuildInternalCollectionCb(err, data));
                return;
              }
            });
        });
        dbInterface.updateInternalCrawledUrl(crawlObj.internalUrlId, function() {
           //internal url is retrived from the collection by the slug
            dbInterface.getNextInternalRecord(crawlObj.internalUrlId, function(err, record) {
                if(!record) { //if result null then end crawl
                    console.log('couldnt get next record for this id ' + crawlObj.internalUrlId);
                    crawlerActive = false;
                    dbInterface.rebuildInternalCollection(rebuildInternalCollectionCb(err, data));
                    return;
                }
                else {
                  crawlObj.request.url = record.url;
                  crawlObj.internalUrl.url = record.url;
                  crawlObj.internalUrlId = record._id;

                  //manage crawlerActive flag before the recursion is called
                  //recursion here!!!
                  crawl(crawlObj.request);
                }
            });
        });
    });
}

//all starts here
init()

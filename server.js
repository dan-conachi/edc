//
// # Crawler
//
'use strict'

var $ = require('cheerio');
var req = require('request');
var URL = require('./modules/urlHandler');
var dbInterface = require('./modules/CRUD');
var crawlObj = require('./modules/CRUD').crawlObj;
var config = require('./config.js');

//url property is the starting crawling point (should be without trailing slash '/' at the end for now!)
//uses MongoDB for storing internal and external URLs :) t.e can crawl huge websites with > 100K urls!

//initialize crawl object
function init() {
  dbInterface.init(function(err, data) {
    crawl(data);
  });
}

function rebuildInternalCollectionCb() {
  //insert here the new domain to be crawled
  dbInterface.updateSourceCrawledDomain(crawlObj.currentDomainId, function() {
    dbInterface.getNextSourceDomain(crawlObj.currentDomainId, function(err, data) {
      crawlObj.currentDomainId = data._id;
      crawlObj.domainName = data.url;
      dbInterface.insertInternalUrl(crawlObj.domainName, function(err, res) {
        config.crawlerActive = true;
        crawl(crawlObj.request);
      });
    });
  });
}

function crawl(reqestObj) {
    //crawlerActive is a flag to manage stop/start crawler
    if(!config.crawlerActive) return;
    console.log('crawling: ' + reqestObj.url);
    req(reqestObj, function(err, response, body) {
        if(err) console.log(err.message);
        if(body) {
          var html  = $.load(body);
          //iterate on each anchor from body
          html('a').each(function() {
              URL.manageUrl(this.attribs.href, crawlObj.domainName);
          });
        }

        //because of crawlerActive = false; in previous block
        if(!config.crawlerActive) return;
        dbInterface.updateInternalCrawledUrl(crawlObj.internalUrlId, function() {
           //internal url is retrived from the collection by id
            dbInterface.getNextInternalRecord(crawlObj.internalUrlId, function(err, record) {
                if(!record) { //if result null then end crawl
                    console.log('couldnt get next record for this id ' + crawlObj.internalUrlId);
                    config.crawlerActive = false;
                    dbInterface.rebuildInternalCollection(rebuildInternalCollectionCb;
                    return;
                }
                else {
                  try {
                    crawlObj.request.url = encodeURI(decodeURI(record.url));
                  }
                  catch(e) {
                    try {
                      crawlObj.request.url = encodeURIComponent(decodeURIComponent(record.url));
                    }
                    catch(e) {
                      dbInterface.updateInternalCrawledUrl(crawlObj.internalUrlId, function() {
                        return;
                      });
                    }
                  }
                  crawlObj.internalUrl = record.url;
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
init();

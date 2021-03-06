//this module exposes methods for retriving SEO data about domains and urls
'use strict'

var $ = require('cheerio');
var req = require('request');

function getDomainAge(domain, callback) {
  var ageUrl = "http://web.archive.org/web/*/" + domain;
  var regexp = /([0-9]{4})$/g;

  req({url : ageUrl, method : 'GET'}, function(err, response, body) {
    if(!body){
      callback(err, null);
      return;
    }
    var html = $.load(body);
    var dates = [];
    html("#wbMeta a[href^='/web/']").each(function(index, obj) {
        var anchor = obj.children[0].data;
        if(anchor) {
          var regDate = anchor.match(regexp);
          if(Array.isArray(regDate)) {
            dates.push(regDate[0]);
          }
        }
      });
    if(dates.length > 0) {
      callback(err, dates[0]);
    }
    else {
      callback(err, null);
    }
  });
}

function getIndexedPagesInG(domain, callback) {
  var googleUrl = 'http://www.google.com/search?hl=en&safe=off&q=site%3A' + domain + '&btnG=Search&gws_rd=cr';
  var regexp = /([0-9])/g;
  var requestObj = {
    url : googleUrl,
    method : 'GET'
  }

  req(requestObj, function(err, response, body) {
    if(!body) {
      return;
    }
    var html = $.load(body);
    var text = html('#resultStats').text();
    var cleanText = text.replace(/[,\s\.]/g, '');
    var numbersArray = text.match(regexp);
    if(numbersArray) {
      var index = numbersArray.join('');
      callback(err, parseInt(index, 10));
    }
    else {
      callback(err, null);
    }
  });
}

function getSemrushBacklinks(domain, callback) {
  var semrushLinks = 'http://publicapi.bl.semrush.com/?url=' + domain;
  var requestObj = {
    url : semrushLinks,
    method : 'GET'
  }

  req(requestObj, function(err, response, body) {
    if(!body) return;
    var html = $.load(body);
    var links = html('links_domain').text();
    if(links) {
      callback(null, links);
    }
    else {
      callback(null, 0);
    }
  });
}

function checkDomainRegistration(domain, cb) {
  var service = 'http://www.checkdomain.com/cgi-bin/checkdomain.pl?domain=' + domain;
  var requestObj = {
    url : service,
    method : 'GET'
  }

  req(requestObj, function(err, response, body) {
    if(err) console.log("Error: " + err);
    if(body) {
      var html = $.load(body);
      var textBody = html('table').text();
      var regexp = /is\sstill\savailable/ig;
      var result = textBody.match(regexp);
      if(Array.isArray(result)) {
        cb(err, {isAvailable : true});
      }
      else {
        cb(err, {isAvailable : false});
      }
    }
    else {
      console.log(err);
      cb(err, {isAvailable : false});
    }
  });

}

module.exports = {
  getDomainAge : getDomainAge,
  getIndexedPagesInG : getIndexedPagesInG,
  getSemrushBacklinks : getSemrushBacklinks,
  checkDomainRegistration : checkDomainRegistration
};

var URL = require('url');
var dbInterface = require('../modules/CRUD');
var checkDomain = require("check-domain");

//url type to be checked against the host domain that's beeing crawled / returns 'internal' or 'external'
var urlType = function(checkedUrl, crawledDomain) {
    var type = '';
    var parsedUrl = URL.parse(checkedUrl); //parse the URL string into an object
    var hostUrl = URL.parse(crawledDomain);
    if(parsedUrl.host && (parsedUrl.host !== hostUrl.host)) {
        //different domain from the host that has to be saved into collection
        type = 'external';
    }
    else { //internal url
        type = 'internal';
    }
    return type;
};

var getDomainName = function(url) {
    var parsedUrl = URL.parse(url); //parse the URL string into an object
    //if internal relative path
    if(!parsedUrl.host) {
        return '';
    }
    return parsedUrl.host;
};

var isResourceFile = function(url) {
    var resource;
    try {
        resource = URL.parse(url);
    } catch(e) {
        return false;
    }
    var string = resource.href;
    var matchWebFile = string.match(/.(html|htm|php|asp|aspx|jsp)/i);
    if(matchWebFile) {
        return false;
    }
    var matchSourceFile = string.match(/\.([A-Za-z]{2,4})$/i); //match files with extensions between 2 and 4 symbols
    if(matchSourceFile) {
        return true; //is a resource file
    }
    return false;
};

function getSlug(url) {
  var slug = '';
  var urlObj = URL.parse(url);
  if(urlObj.pathname) {
    slug += urlObj.path;
  }
  return slug;
}

function isJavaScript(url) {
  if(url.indexOf('javascript:') !== -1) {
    return true
  }
  return false;
}

var stripHash = function(url) {
    var cleanUrl;
    var pattern = /.+?(?=#)/;
    var matchString;
    //if starts with #hash we got un falsey value
    if(!url || url[0] === '#') {
        return '';
    }
    //remove
    if(url.indexOf('#') !== -1) {
        matchString = url.match(pattern);
        if(!matchString) return url;
        cleanUrl = matchString[0]; //because match returns an array!
        return cleanUrl;
    }
    return url;
};

var isRelativePath = function(checkedUrl) {
    var urlObject = URL.parse(checkedUrl);
    //if value is falsey
    if(!urlObject.host) {
        return true;
    }
    return false;
};

//make sure here that we end up with a full url!
var buildFullInternalUrl = function(checkedUrl, crawledUrl) {
    var urlObject = URL.parse(crawledUrl);
    var protocol = urlObject.protocol || 'http';
    var slashes = urlObject.slashes ? '//' : '';
    var host = urlObject.host;
    var fullUrl = stripHash(checkedUrl);
    //if relative path add host
    if(isRelativePath(checkedUrl)) {
        checkedUrl = checkedUrl[0] === '/' ? checkedUrl : '/' + checkedUrl;
        fullUrl = protocol + slashes + host + checkedUrl;
    }
    return fullUrl;
};

var checkExpired = function(url, callback) {
    // majecticKey : "", don't have it yet
    //whois : {user : "", password : ""}, don't have it yet

    //var domainString = getDomainName(url);
    if(!url) {
        console.log('external url wrong' + url);
        return;
    }
    var options = {
        domain : url.toString(),
        majecticKey : "",
        whois : {user : "", password : ""},
        noCheckIfDNSResolve : true, // if true, the availability & the complte whois data is not retrieved if there is a correct DNS resolve (default false)
        onlyAvailability :  true
    };

    checkDomain(options, callback);
};

var manageUrl = function(checkedUrl, crawledUrl, callback) {
    var externalDomain = '';
    var internalUrl = '';
    //add cases where url not valid to be added into the DB
    //url points to a resource like jpg, pdf etc.
    if(isResourceFile(checkedUrl)) return;
    //if url is a hash
    if(!stripHash(checkedUrl)) return;
    //if is javascript void
    if(isJavaScript(checkedUrl)) return;

    //check type of each anchor url from body
    var type = urlType(checkedUrl, crawledUrl);
    if(type === 'internal') {
        internalUrl = buildFullInternalUrl(checkedUrl, crawledUrl);
        //handle internal urls
        dbInterface.insertInternalUrl(internalUrl, function(err, data) {
            callback(err, data);
        });
    }
    else {
        //get only the host name to work with
        externalDomain = getDomainName(checkedUrl);
        if(!externalDomain) return;
        checkExpired(externalDomain, function(err, res) {
            if(err) console.log(err.message);
            //do some check for the domain, not to insert invalid domains and subdomains
            if(!res.isDNSFound) {
                console.log('insert expired ' + externalDomain);
                dbInterface.insertExpired(externalDomain, function() {
                    //if all fine here do what?
                });
            }
            //if not expired check number of indexed url and age for the domain
            else {

            }
        });
    }
};

module.exports = {
     manageUrl : manageUrl,
     getSlug : getSlug,
     getDomainName : getDomainName
};

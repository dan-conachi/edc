var URL = require('url');
var dbInterface = require('../modules/CRUD');
var checkDomain = require("check-domain");

//url type to be checked against the host domain that's beeing crawled / returns 'internal' or 'external'
var urlType = function(checkedUrl, crawledUrl) {
    var type = '';
    var parsedUrl = URL.parse(checkedUrl); //parse the URL string into an object
    var hostUrl = URL.parse(crawledUrl);
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
    console.log('get Domain name vryshta ' + parsedUrl.host);
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
    var match = string.match(/\.([a-z]{2,4})$/); //match files with extensions between 2 and 4 symbols
    if(match) {
        return true; //is a resource file
    }
    return false;
};

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

var manageUrl = function(checkedUrl, crawledUrl) {
    //add cases where url not valid to be added into the DB
    
    //url points to a resource like jpg, pdf etc.
    if(isResourceFile(checkedUrl)) return;
    //if url is a hash
    if(!stripHash(checkedUrl)) return;
    
    //check type of each anchor url from body
    var type = urlType(checkedUrl, crawledUrl);
    if(type === 'internal') {
        var internalUrl = buildFullInternalUrl(checkedUrl, crawledUrl);
        //handle internal urls
        dbInterface.insertInternalUrl(internalUrl);
    }
    else {
        console.log('found an external link:' + checkedUrl);
        //get only the host name to work with
        var externalUrl = getDomainName(checkedUrl);
        checkExpired(externalUrl, function(err, res) {
            if(err) console.log(err.message);
            console.log('res vryshta za DNS : ' + res.isDNSFound);
            if(!res.isDNSFound) {
                dbInterface.insertExpired(externalUrl, function() {
                    //if all fine here do what?
                });
            }
        });
    }
};

module.exports = {
     manageUrl : manageUrl
};
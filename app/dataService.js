'use strict';

domainsService.$inject = ['$http'];
function domainsService($http) {
    /*Returns a Promis to be used*/
    function getDomains() {
      return $http.get('/api/v1/domains');
    }

    function getLastDomains(num) {
      var number = num || 50;
      return $http.get('/api/v1/domains/last/' + number);
    }

    function checkDomainRegistration(domain) {
      var req = '/api/v1/domains/checkAvailability/' + domain;
      return $http.get(req);
    }

    return {
      getDomains : getDomains,
      getLastDomains : getLastDomains,
      checkDomainRegistration : checkDomainRegistration
    }
}

export default domainsService;

/*API methods */

function getDomainsData(query, callback) {
  var q = query || {};
  //var expired = new ExpiredModel();
  ExpiredModel.find(q).exec(function(err, data) {
    callback(err, data);
  });
}

function getLastDomains(number, callback) {
  var num = number || 50;
  ExpiredModel.find().limit(num).sort({_id : -1}).exec(function(err, data) {
    callback(err, data);
  });
}

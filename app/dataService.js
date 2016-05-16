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

    function searchDomains(term, backlinks, limit) {
      var search = term || undefined;
      var bl = backlinks || undefined;
      var lm = limit || undefined;
      return $http.get('/api/v1/domains/search/' + search + '/' + bl + '/' + lm);
    }

    return {
      getDomains : getDomains,
      getLastDomains : getLastDomains,
      checkDomainRegistration : checkDomainRegistration,
      searchDomains : searchDomains
    }
}

export default domainsService;

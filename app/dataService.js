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

    return {
      getDomains : getDomains,
      getLastDomains : getLastDomains
    }
}

export default domainsService;

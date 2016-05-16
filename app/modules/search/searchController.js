'use strict';

searchController.$inject = ['domainsService'];
function searchController(domainsService) {
    var service = domainsService;
    this.domainAvailable;
    this.domains = [];

    this.search = function(term, bl, limit) {
      service.searchDomains(term, bl, limit).then((res) => {
        this.domains = res.data;
      });
    }

    //sends request to check if domain is free or registered
    this.getDomainAvailability = function(obj) {
      service.checkDomainRegistration(obj.domain.url).then((res) => {
        obj.domain.domainAvailable = res.data.isAvailable;
      });
    }

}

export default searchController;

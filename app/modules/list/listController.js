'use strict';

listController.$inject = ['domainsService'];
function listController(domainsService) {
    this.domains = [];
    this.domainAvailable;
    var service = domainsService;

    service.getLastDomains().then((res) => {
      var domainList = res.data;
      //add domainAvailable property on each object
      var length = domainList.length;
      for(var i = 0;i < length;i++) {
        domainList[i]['domainAvailable'] = undefined;
      }
      this.domains = domainList;
    });

    this.findDomains = function() {
      service.getDomains().then((res) => {
        this.domains = res.data;
      });
    }

    //sends request to check if domain is free or registered
    this.getDomainAvailability = function(domain) {
      service.checkDomainRegistration(domain.url).then((res) => {
        domain.domainAvailable = res.data.isAvailable;
      });
    }

    this.saveDomain = function(obj) {
      service.saveSelectedDomain(obj).then((res) => {
        if(res.statusText === 'OK') {
          obj.isSaved = true;
        }
      });
    }
}

export default listController;

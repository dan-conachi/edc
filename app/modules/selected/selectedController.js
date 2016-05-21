'use strict';

selectedController.$inject = ['domainsService'];
function selectedController(domainsService) {
    this.domains = [];
    this.domainAvailable;
    var service = domainsService;

    service.getSavedDomains().then((res) => {
      var domainList = res.data;
      //add domainAvailable property on each object
      var length = domainList.length;
      for(var i = 0;i < length;i++) {
        domainList[i]['domainAvailable'] = undefined;
      }
      this.domains = domainList;
    });

    this.removeSavedDomain = function(domain) {
      service.removeSavedDomains(domain._id).then((res) => {
        if(res.statusText === 'OK') {
          let index;
          for(index in this.domains) {
            if(this.domains[index]._id === domain._id) {
              //remove object from array
              this.domains.splice(index, 1);
            }
          }
        }
      });
    };

    //sends request to check if domain is free or registered
    this.getDomainAvailability = function(domain) {
      service.checkDomainRegistration(domain.url).then((res) => {
        domain.domainAvailable = res.data.isAvailable;
      });
    }
}

export default selectedController;

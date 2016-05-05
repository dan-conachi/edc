'use strict';

listController.$inject = ['domainsService'];
function listController(domainsService) {
    this.domains = '';
    var service = domainsService;

    service.getLastDomains().then((res) => {
      this.domains = res.data;
    });

    this.findDomains = function() {
      service.getDomains().then((res) => {
        this.domains = res.data;
      });
    }
}

export default listController;

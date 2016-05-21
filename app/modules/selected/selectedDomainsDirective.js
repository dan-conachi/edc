'use strict';
import selectedController from './selectedController.js';

function selectedDomainsDirective() {
  return {
    restrict : 'E',
    templateUrl : '/partials/selectedDirective.html',
    controller : selectedController,
    controllerAs: 'selected'
  }
}

export default selectedDomainsDirective;

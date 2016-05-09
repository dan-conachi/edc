'use strict';
import listController from './listController';

function listDirective() {
  return {
    restrict : 'E',
    templateUrl : '/partials/listDomains.html',
    controller : listController,
    controllerAs : 'list'
  }
}

export default listDirective;

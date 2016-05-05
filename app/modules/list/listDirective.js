'use strict';
import listController from './listController';

function listDirective() {
  return {
    restric : 'E',
    templateUrl : '/modules/list/listDomains.html',
    controller : listController,
    controllerAs : 'list'
  }
}

export default listDirective;

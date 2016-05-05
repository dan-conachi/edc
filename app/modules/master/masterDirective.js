import masterController from './masterController';

function masterDirective() {
  return {
    restrict: 'E',
    templateUrl: '/modules/master/masterDirective.html',
    controller : masterController,
    controllerAs : 'master'
  }
}

export default masterDirective;

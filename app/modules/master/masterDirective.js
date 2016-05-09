import masterController from './masterController';

function masterDirective() {
  return {
    restrict: 'E',
    templateUrl: '/partials/masterDirective.html',
    controller : masterController,
    controllerAs : 'master'
  }
}

export default masterDirective;

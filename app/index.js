import angular, {module, bootstrap} from 'angular';
import ngRoute from 'angular-route';
import './modules/master/';
import './modules/list/';
import domainsService from './dataService';

angular.module('exDomains', ['master', 'domains', 'ngRoute'])
  .factory('domainsService', domainsService)
  .config(configRoute);

document.addEventListener('DOMContentLoaded', ()=> {
  var appContainer = document.querySelector('#app-container');
  angular.bootstrap(appContainer, ['exDomains']);
});

configRoute.$inject = ['$routeProvider'];
function configRoute($routeProvider) {
  $routeProvider
    .when('/', {
        template : '<list-domains></list-domains>'
    })
    .otherwise({redirectTo : '/'})
}

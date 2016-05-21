import angular, {module, bootstrap} from 'angular';
import ngRoute from 'angular-route';
import './modules/master/';
import './modules/list/';
import './modules/search/';
import './modules/selected/';
import domainsService from './dataService';

angular.module('exDomains', ['Master', 'List', 'Search', 'Selected', 'ngRoute'])
  .factory('domainsService', domainsService)
  .config(configRoute);

configRoute.$inject = ['$routeProvider'];
function configRoute($routeProvider) {
  $routeProvider
    .when('/', {
        template : '<list-domains class="list-domains"></list-domains>',
        tab : 'index'
    })
    .when('/search', {
        template : '<search-domains class="list-domains"></search-domains>',
        tab : 'search'
    })
    .when('/selected', {
        template : '<selected-domains class="list-domains"></selected-domains>',
        tab : 'selected'
    })
    .otherwise({redirectTo : '/'})
}

document.addEventListener('DOMContentLoaded', ()=> {
  var appContainer = document.querySelector('#app-container');
  angular.bootstrap(appContainer, ['exDomains']);
});

'use strict';

import searchController from './searchController.js'

function searchDomains() {
  return {
    restrict : 'E',
    templateUrl : '/partials/searchDirective.html',
    controller: searchController,
    controllerAs: 'search'
  }
}

export default searchDomains;

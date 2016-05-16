'use strict';

import module from 'angular';
import searchDomains from './searchDomains.js';
import searchController from './searchController.js'

angular.module('Search', [])
          .directive('searchDomains', searchDomains)
          .controller('searchController', searchController);

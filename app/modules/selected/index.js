'use strict';

import module from 'angular';
import selectedDomainsDirective from './selectedDomainsDirective.js'

angular.module('Selected', [])
      .directive('selectedDomains', selectedDomainsDirective);

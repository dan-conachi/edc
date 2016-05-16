'use strict';

import {module} from 'angular';
import list from './listDirective';

angular.module('List', [])
    .directive('listDomains', list);

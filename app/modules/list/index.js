'use strict';

import {module} from 'angular';
import list from './listDirective';

angular.module('domains', [])
    .directive('listDomains', list);

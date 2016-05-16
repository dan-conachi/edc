'use strict'

import {module} from 'angular';
import masterDirective from './masterDirective.js'

angular.module('Master', [])
  .directive('masterComponent', masterDirective);

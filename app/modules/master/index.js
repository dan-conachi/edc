'use strict'

import {module} from 'angular';
import masterDirective from './masterDirective.js'

angular.module('master', [])
  .directive('masterComponent', masterDirective);

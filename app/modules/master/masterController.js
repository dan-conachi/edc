'use strict';

masterController.$inject = ['$route'];
export default function masterController($route) {
  this.$route = $route;
}

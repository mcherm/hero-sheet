import Vue from 'vue'
import App from './App.vue'
import {registerStandardComponents} from "@/js/registerStandardComponents.js";

// Pre-register all components that will be involved in recursion or are widely used
registerStandardComponents();

const app = new Vue({
  el: "#app",
  render: h => h(App)
});
Vue.config.devtools = true;

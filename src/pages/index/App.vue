<template>
  <div id="app">
    <entire-page/>
    <div class="copyright-notice">
      Code &copy; 2020 by Michael Chermside;
      Game content licensed under <a href="game_license.html">Open Gaming License</a>;
      Other code subject to <a href="software_license.html">various licenses</a>.
    </div>
  </div>
</template>

<script>
  import Vue from 'vue';
  import EntirePage from "@/components/EntirePage.vue";

  // Create a global "$globals" available on all vue instances. (NOT reactive).
  const globals = {
    eventBus: new Vue({}),
    developerMode: false,
    deployment: "prod",
  };
  Vue.prototype.$globals = globals;

  export default {
    name: "app",
    components: {
      EntirePage
    }
  }
</script>

<style>
</style>

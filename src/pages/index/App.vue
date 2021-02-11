<template>
  <div id="app">
    <entire-page/>
  </div>
</template>

<script>
  import Vue from 'vue';
  import EntirePage from "@/components/EntirePage.vue";
  import {initializeGlobals} from "@/js/heroSheetUtil.js";

  // Create a global "$globals" available on all vue instances. (NOT reactive).
  Vue.prototype.$globals = initializeGlobals(location.hostname);

  export default {
    name: "app",
    components: {
      EntirePage
    }
  }
</script>

<style>
</style>

<!--
  This is a control for use in play which allows easy access to control which powers
  are currently active.
-->
<template>
  <boxed-section title="Active Powers">
    <div class="activation-panel grid-with-lines">
      <activation-panel-rows :powerList="getCharsheet().powers" :indent-level="0"/>
    </div>
  </boxed-section>
</template>

<script>
  export default {
    name: "ActivationPanel",
    inject: ["getCharsheet"],
  }
</script>

<style scoped>
  .activation-panel {
    display: inline grid;
    grid-template-columns: max-content max-content;
  }
</style>

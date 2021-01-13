<!--
  This is a control for use in play which allows easy access to control which powers
  are currently active.
-->
<template>
  <boxed-section title="Active Powers">
    <div class="column">
      <div class="activation-panel grid-with-lines">
        <activation-panel-rows
            :powerList="getCharsheet().powers"
            :indent-level="0"
            :activation-panel-mode="activationPanelMode"
        />
      </div>
      <div class="controls">
        <select v-model="activationPanelMode">
          <option value="ALL_POWERS">All Powers</option>
          <option value="ARRAYS">Arrays</option>
        </select>
      </div>
    </div>
  </boxed-section>
</template>

<script>
  export default {
    name: "ActivationPanel",
    inject: ["getCharsheet"],
    data: function() {
      return {
        activationPanelMode: "ARRAYS",
      };
    },
  }
</script>

<style scoped>
  .boxed-section > .column {
    background-color: var(--section-color);
  }
  .boxed-section > .column > .activation-panel {
    background-color: var(--paper-color);
  }
  .activation-panel {
    display: inline grid;
    grid-template-columns: max-content max-content;
  }
  .controls {
    margin-top: 5px;
    background-color: var(--section-color);
  }
</style>

<!--
  This component shows the outcome of an attack that does affliction in a little
  folding box.
-->
<template>
  <div>
    <div v-if="!widgetOpened" class="collapsed-header" @click="widgetOpened = true">Weaken [+]</div>
    <div v-else class="attacks-result-damage grid-with-lines">
      <div class="grid-header col-label" @click="widgetOpened = false">Weaken [-]</div>
      <div class="row-label">Success</div>
      <div class="row-data">no effect</div>
      <div class="row-label">Failure</div>
      <div class="row-data">
        Lose as many power points as you failed by, up<br/>
        to a max of
        <span class="sourced-value" title="Attack Ranks">{{attack.ranks}}</span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "AttacksResultWeaken",
  props: {
    attack: { type: Object, required: true }
  },
  data: function() {
    return {
      widgetOpened: false,
    }
  }
}
</script>

<style scoped>
.collapsed-header {
  padding: 2px 6px;
}
.attacks-result-damage {
  grid-template-columns: max-content max-content;
  margin: 3px;
  display: inline grid;
}
.attacks-result-damage .col-label {
  grid-column-end: span 2;
}
.row-label {
  text-transform: none;
  font-weight: normal;
}
.row-data {
  padding: 2px 4px;
}
.sourced-value {
  font-weight: bold;
  cursor: pointer;
}
</style>

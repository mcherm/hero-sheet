<!--
  This component shows the outcome of an attack that does affliction in a little
  folding box.
-->
<template>
  <div>
    <div v-if="!widgetOpened" class="collapsed-header" @click="widgetOpened = true">Affliction [+]</div>
    <div v-else class="attacks-result-damage grid-with-lines">
      <div class="grid-header col-label" @click="widgetOpened = false">Affliction [-]</div>
      <div class="row-label">Success</div>
      <div class="row-data">no effect</div>
      <div class="row-label">Failure</div>
      <div class="row-data">
        Target is Dazed, Entranced, Fatigued,<br/>
        Hindered, Impaired, or Vulnerable
      </div>
      <div class="row-label">Failure by 6+</div>
      <div class="row-data">
        Target is Compelled, Defenseless,<br/>
        Disabled, Exhausted, Immobile, Prone,<br/>
        or Stunned</div>
      <div class="row-label">Failure by 11+</div>
      <div class="row-data">
        Target is Asleep, Controlled, Incapacitated,<br/>
        Paralyzed, Transformed, or Unaware
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "AttacksResultAffliction",
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
</style>

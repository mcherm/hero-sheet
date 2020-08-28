<!--
  This component shows the outcome of an attack that does damage in a little
  folding box.
-->
<template>
  <div>
    <div v-if="!widgetOpened" class="collapsed-header" @click="widgetOpened = true">Damage [+]</div>
    <div v-else class="attacks-result-damage grid-with-lines">
      <div class="grid-header col-label" @click="widgetOpened = false">Damage [-]</div>
      <div class="row-label">Success</div>
      <div class="row-data">no effect</div>
      <div class="row-label">Failure</div>
      <div class="row-data">+1 Damage Penalty</div>
      <div class="row-label">Failure by 5+</div>
      <div class="row-data">...and Dazed until next turn</div>
      <div class="row-label">Failure by 10+</div>
      <div class="row-data">...and Staggered</div>
      <div class="row-label">Failure by 15+ or is Staggered</div>
      <div class="row-data">...and Incapacitated</div>
      <div class="row-label">Failure (if Incapacitated)</div>
      <div class="row-data">...and Dying</div>
      <div class="row-label">Failure (already Dying)</div>
      <div class="row-data">DEAD</div>
    </div>
  </div>
</template>

<script>
export default {
  name: "AttacksResultDamage",
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

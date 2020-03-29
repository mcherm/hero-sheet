<template>
  <div class="horizontal">
    <div v-if="extraLabel" class="cost-display grid-with-lines">
      <label class="row-label">{{extraLabel}}</label>
      <number-display :value="extraValueFunction(charsheet)"/>
    </div>
    <div class="cost-display grid-with-lines">
      <label class="row-label">character</label>
      <div class="horizontal">
        <number-display :value="totalCost(charsheet)" :isOutOfSpec="costOutOfSpec(charsheet)"/>
        <span class="spacerWord">of</span>
        <number-display :value="availablePoints(charsheet)" :isOutOfSpec="costOutOfSpec(charsheet)"/>
      </div>
    </div>
  </div>
</template>

<script>
  import {advantageCost, costOutOfSpec, totalCost, availablePoints} from "../js/heroSheetUtil";

  export default {
    name: "LocalCostDisplay",
    props: {
      charsheet: { type: Object, required: true },
      extraLabel: { type: String, required: false, default: "" },
      extraValueFunction: { type: Function, required: false }
    },
    methods: {
      advantageCost,
      totalCost,
      availablePoints,
      costOutOfSpec
    }
  }
</script>

<style scoped>
  .cost-display {
    grid-template-columns: max-content max-content max-content;
    margin: 0 2px;
  }
  .cost-display > .row-label {
    background-color: var(--paper-color);
  }
  .spacerWord {
    background-color: var(--paper-color);
  }
  .horizontal {
    display: flex;
    align-items: baseline;
  }
</style>
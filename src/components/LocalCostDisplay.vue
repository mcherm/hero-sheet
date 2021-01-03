<template>
  <div class="horizontal">
    <div v-if="extraLabel" class="cost-display grid-with-lines">
      <label class="row-label">{{extraLabel}}</label>
      <number-display :value="extraValueFunction(getCharsheet())"/>
    </div>
    <div class="cost-display grid-with-lines">
      <label class="row-label">character</label>
      <div class="horizontal">
        <number-display :value="totalCost(getCharsheet())" :isOutOfSpec="costOutOfSpec(getCharsheet())"/>
        <span class="spacerWord">of</span>
        <number-display :value="availablePoints(getCharsheet())" :isOutOfSpec="costOutOfSpec(getCharsheet())"/>
      </div>
    </div>
  </div>
</template>

<script>
  import {advantageCost, costOutOfSpec, totalCost, availablePoints} from "@/js/heroSheetUtil.js";

  export default {
    name: "LocalCostDisplay",
    inject: ["getCharsheet"],
    props: {
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
    background-color: var(--paper-color);
  }
  .horizontal {
    display: flex;
    align-items: baseline;
  }
</style>
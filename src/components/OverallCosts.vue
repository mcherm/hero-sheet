<template>
  <boxed-section title="Costs">
    <div class="cost-grid grid-with-lines">
      <label class="row-label">Abilities</label>
      <number-display :value="abilityCost(getCharsheet())" class="values-column"/>
      <label class="row-label">Defenses</label>
      <number-display :value="defenseCost(getCharsheet())" class="values-column"/>
      <label class="row-label">Skills</label>
      <number-display :value="skillCost(getCharsheet())" class="values-column"/>
      <label class="row-label">Advantages</label>
      <number-display :value="advantageCost(getCharsheet())" class="values-column"/>
      <label class="row-label">Equipment</label>
      <number-display :value="equipmentCost(getCharsheet())" class="values-column"/>
      <label class="row-label">Powers</label>
      <number-display :value="powerCost(getCharsheet())" class="values-column"/>
      <label class="row-label">TOTAL</label>
      <number-display :value="totalCost(getCharsheet())" :isOutOfSpec="costOutOfSpec(getCharsheet())" class="values-column"/>
      <div class="grid-spacer grid-with-lines-no-lines"/>
      <div class="grid-spacer grid-with-lines-no-lines"/>
      <label class="row-label">Available</label>
      <number-display :value="availablePoints(getCharsheet())" class="values-column"/>
    </div>
  </boxed-section>
</template>

<script>
  import {
    abilityCost, defenseCost, skillCost, advantageCost, equipmentCost, powerCost,
    totalCost, availablePoints, costOutOfSpec
  } from "@/js/heroSheetUtil.js";

  export default {
    name: "OverallCosts",
    inject: ["getCharsheet"],
    methods: {
      abilityCost,
      defenseCost,
      skillCost,
      advantageCost,
      equipmentCost,
      powerCost,
      totalCost,
      availablePoints,
      costOutOfSpec
    }
  }
</script>

<style scoped>
  .cost-grid {
    grid-template-columns: max-content max-content;
  }
  .values-column.number-display {
    margin-left: 0;
  }
  .grid-spacer {
    height: 6px;
    background-color: var(--inapplicable-color);
  }
</style>

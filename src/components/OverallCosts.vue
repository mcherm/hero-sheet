<template>
  <boxed-section title="Costs">
    <div class="cost-grid grid-with-lines">
      <label class="row-label">Abilities</label>
      <number-display :value="abilityCost(character)" class="values-column"/>
      <label class="row-label">Defenses</label>
      <number-display :value="defenseCost(character)" class="values-column"/>
      <label class="row-label">Skills</label>
      <number-display :value="skillCost(character)" class="values-column"/>
      <label class="row-label">Advantages</label>
      <number-display :value="advantageCost(character)" class="values-column"/>
      <label class="row-label">Powers</label>
      <number-display :value="powerCost(character)" class="values-column"/>
      <label class="row-label">TOTAL</label>
      <number-display :value="totalCost(character)" :isOutOfSpec="costOutOfSpec(character)" class="values-column"/>
      <div class="grid-spacer grid-with-lines-no-lines"/>
      <div class="grid-spacer grid-with-lines-no-lines"/>
      <label class="row-label">Available</label>
      <number-display :value="availablePoints(character)" class="values-column"/>
    </div>
  </boxed-section>
</template>

<script>
  import {abilityCost, defenseCost, skillCost, advantageCost, powerCost, totalCost, availablePoints, costOutOfSpec} from "../js/heroSheetUtil";

  export default {
    name: "OverallCosts",
    props: {
      character: { type: Object, required: true }
    },
    methods: {
      abilityCost,
      defenseCost,
      skillCost,
      advantageCost,
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

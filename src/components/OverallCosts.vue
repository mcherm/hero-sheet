<template>
  <boxed-section :title="'Costs'">
    <div class="cost-grid grid-with-lines">
      <label class="row-label">Abilities</label>
      <number-display :value="abilityCost" class="values-column"/>
      <label class="row-label">Defenses</label>
      <number-display :value="defenseCost" class="values-column"/>
      <label class="row-label">Skills</label>
      <number-display :value="skillCost" class="values-column"/>
      <label class="row-label">Advantages</label>
      <number-display :value="advantageCost" class="values-column"/>
      <label class="row-label">Powers</label>
      <number-display :value="powerCost" class="values-column"/>
      <label class="row-label">TOTAL</label>
      <number-display :value="totalCost" :isOutOfSpec="costOutOfSpec" class="values-column"/>
      <div class="grid-spacer grid-with-lines-no-lines"/>
      <div class="grid-spacer grid-with-lines-no-lines"/>
      <label class="row-label">Available</label>
      <number-display :value="availablePoints" class="values-column"/>
    </div>
  </boxed-section>
</template>

<script>
  export default {
    name: "OverallCosts",
    props: {
      character: { type: Object, required: true }
    },
    computed: {
      abilityCost: function() {
        return Object.values(this.character.abilities).reduce(
          (x,y) => x + y.cost, 0);
      },
      defenseCost: function() {
        return Object.values(this.character.defenses).reduce(
          (x,y) => x + y.cost, 0);
      },
      skillCost: function() {
        return this.character.skills.cost;
      },
      advantageCost: function() {
        return this.character.advantages.reduce(
          (x,y) => x + (y.isRanked ? y.ranks : 1), 0);
      },
      powerCost: function() {
        return Object.values(this.character.powers).reduce(
          (x,y) => x + y.cost, 0);
      },
      totalCost: function() {
        return this.abilityCost + this.defenseCost + this.skillCost +
          this.advantageCost + this.powerCost;
      },
      availablePoints: function() {
        const c = this.character.campaign;
        return c.powerLevel * 15 + c.xpAwarded;
      },
      costOutOfSpec: function() {
        return this.totalCost > this.availablePoints;
      }
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

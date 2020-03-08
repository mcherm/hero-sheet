<template>
  <div class="display-contents">
    <div class="grid-with-lines-cell">{{advantage.name}}</div>
    <number-entry v-if="advantage.isRanked" v-model="advantage.ranks"/>
    <div v-else class="grid-with-lines-cell inapplicable"></div>
    <div class="grid-with-lines-cell">
      {{advantage.effect}}
      <docs-lookup :docsURL="docsURL"/>
    </div>
    <string-entry v-model="advantage.description" class="grid-with-lines-cell"/>
    <button
      v-if="deleteIsVisible"
      class="trash-button grid-with-lines-no-lines"
      v-on:click="$delete(advantages, advantages.indexOf(advantage))"
    >
      <trash-icon/>
    </button>
  </div>
</template>

<script>
  // FIXME: known bug: Luck costs 2 per level, not 1.
  const standardAdvantages = require("../data/standardAdvantages.json");

  export default {
    name: "AdvantagesRow",
    props: {
      advantage: { type: Object, required: true },
      advantages: { type: Array, required: true },
      deleteIsVisible: { type: Boolean, required: true }
    },
    data: function() {
      return {
        docsURL: null
      }
    },
    created: function() {
      const advantageData = standardAdvantages[this.advantage.name];
      this.advantage.effect = advantageData.description;
      this.advantage.isRanked = advantageData.isRanked;
      this.docsURL = advantageData.docsURL;
      if (advantageData.isRanked && this.advantage.ranks === null) {
        this.advantage.ranks = 1;
      }
    }
  }
</script>

<style scoped>
  div.display-contents {
    display: contents;
  }
  .inapplicable {
    background-color: var(--inapplicable-color);
  }
</style>

<template>
  <div class="display-contents">
    <div class="grid-with-lines-cell">{{advantage.name}}</div>
    <NumberEntry v-if="advantage.isRanked" v-model="advantage.ranks"/>
    <div v-else class="grid-with-lines-cell inapplicable"></div>
    <div class="grid-with-lines-cell">
      {{advantage.effect}}
      <DocsLookup :docsURL="docsURL"/>
    </div>
    <StringEntry v-model="advantage.description" class="grid-with-lines-cell"/>
    <button
      v-if="deleteIsVisible"
      class="trash-button grid-with-lines-no-lines"
      v-on:click="$delete(advantages, advantages.indexOf(advantage))"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"><path d="M16 9v4.501c-.748.313-1.424.765-2 1.319v-5.82c0-.552.447-1 1-1s1 .448 1 1zm-4 0v10c0 .552-.447 1-1 1s-1-.448-1-1v-10c0-.552.447-1 1-1s1 .448 1 1zm1.82 15h-11.82v-18h2v16h8.502c.312.749.765 1.424 1.318 2zm-6.82-16c.553 0 1 .448 1 1v10c0 .552-.447 1-1 1s-1-.448-1-1v-10c0-.552.447-1 1-1zm14-4h-20v-2h5.711c.9 0 1.631-1.099 1.631-2h5.316c0 .901.73 2 1.631 2h5.711v2zm-1 2v7.182c-.482-.115-.983-.182-1.5-.182l-.5.025v-7.025h2zm3 13.5c0 2.485-2.017 4.5-4.5 4.5s-4.5-2.015-4.5-4.5 2.017-4.5 4.5-4.5 4.5 2.015 4.5 4.5zm-3.086-2.122l-1.414 1.414-1.414-1.414-.707.708 1.414 1.414-1.414 1.414.707.708 1.414-1.414 1.414 1.414.708-.708-1.414-1.414 1.414-1.414-.708-.708z"/></svg>
    </button>
  </div>
</template>

<script>
  import DocsLookup from "./DocsLookup.vue"
  // FIXME: known bug: Luck costs 2 per level, not 1.
  const standardAdvantages = require("../data/standardAdvantages.json");

  export default {
    name: "AdvantagesRow",
    components: {
      DocsLookup
    },
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

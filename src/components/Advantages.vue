<template>
  <BoxedSection :title="'Advantages'">
    <div class="advantages-list grid-with-lines" :class="{ 'deleteInvisible': !deleteIsVisible, 'deleteVisible': deleteIsVisible}">
      <div class="col-label">Advantage</div>
      <div class="col-label">Ranks</div>
      <div class="col-label">Effect</div>
      <div class="col-label">Description</div>
      <div v-if="deleteIsVisible" class="grid-with-lines-no-lines"></div>
      <tr
        v-for="advantage in advantages"
        :key="advantage.name"
        is="AdvantagesRow"
        :advantage="advantage"
        :advantages="advantages"
        :deleteIsVisible="deleteIsVisible"
      />
    </div>
    <div class="scrolling-list-footer">
      <select v-model="selectedAdvantageToAdd">
        <option disabled value="">Select Advantage to Add</option>
        <option
            v-for="standardAdvantage in unusedStandardAdvantages"
            :key="standardAdvantage.name"
        >{{standardAdvantage.name}}</option>
      </select>
      <button v-on:click="addAdvantage()" :disabled="selectedAdvantageToAdd === ''">Add Advantage</button>
      <button v-on:click="deleteIsVisible = !deleteIsVisible">
        <span v-if="deleteIsVisible">Done Deleting</span>
        <span v-else>Delete</span>
      </button>
    </div>
  </BoxedSection>
</template>

<script>
  import AdvantagesRow from "./AdvantagesRow.vue"
  const standardAdvantages = require("../data/standardAdvantages.json");

  export default {
    name: "Advantages",
    components: {
      AdvantagesRow
    },
    props: {
      advantages: { type: Array, required: true }
    },
    data: function() {
      return {
        deleteIsVisible: false,
        selectedAdvantageToAdd: ""
      }
    },
    created: function() {
      this.sortAdvantages();
    },
    computed: {
      // A list of all standardAdvantages that are NOT in use on this character
      unusedStandardAdvantages: function() {
        const advantageInUse = {};
        for (const advantage of this.advantages) {
          advantageInUse[advantage.name] = true;
        }
        return Object.values(standardAdvantages).filter(
          x => !advantageInUse[x.name]);
      }
    },
    methods: {
      sortAdvantages: function() {
        this.advantages.sort((x,y) => x.name.localeCompare(y.name));
      },
      addAdvantage: function() {
        const newAdvantage = {
          name: this.selectedAdvantageToAdd,
          effect: null,
          isRanked: null,
          ranks: null,
          description: ""
        };
        this.advantages.push(newAdvantage);
        this.sortAdvantages();
        this.selectedAdvantageToAdd = "";
      }
    }
  }
</script>

<style scoped>
  .advantages-list.deleteVisible {
    grid-template-columns: 1fr max-content 2fr 2fr max-content;
  }
  .advantages-list.deleteInvisible {
    grid-template-columns: 1fr max-content 2fr 2fr;
  }
  div.scrolling-list-footer {
    background-color: var(--section-color);
    text-align: center;
    margin-top: 5px;
  }
  .trash-button {
    margin: 5px;
    flex: 0;
  }
</style>

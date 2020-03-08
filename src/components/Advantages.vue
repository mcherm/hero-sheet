<template>
  <boxed-section title="Advantages">
    <div class="advantages-list grid-with-lines" :class="{ 'deleteInvisible': !deleteIsVisible, 'deleteVisible': deleteIsVisible}">
      <div class="col-label">Advantage</div>
      <div class="col-label">Ranks</div>
      <div class="col-label">Effect</div>
      <div class="col-label">Description</div>
      <div v-if="deleteIsVisible" class="grid-with-lines-no-lines"></div>

      <div
          v-for="advantage in advantages"
          :key="advantage.name"
          class="display-contents"
      >
        <div class="advantage-type" :class="{isOutOfSpec: standardAdvantage(advantage).isOutOfSpec}">
          <select v-model="advantage.name">
            <option v-if="advantage.name === ''" disabled value="">Select One</option>
            <option v-else :value="advantage.name">{{advantage.name}}</option>
            <option
                v-for="standardAdvantage in unusedStandardAdvantages"
                :key="standardAdvantage.name"
                :value="standardAdvantage.name"
            >{{standardAdvantage.name}}</option>
          </select>
        </div>
        <number-entry v-if="standardAdvantage(advantage).isRanked" v-model="advantage.ranks"/>
        <div v-else class="inapplicable"></div>
        <div :class="{isOutOfSpec: standardAdvantage(advantage).isOutOfSpec}">
          {{standardAdvantage(advantage).description}}
          <docs-lookup :docsURL="standardAdvantage(advantage).docsURL"/>
        </div>
        <string-entry v-model="advantage.description"/>
        <button
            v-if="deleteIsVisible"
            class="trash-button grid-with-lines-no-lines"
            v-on:click="$delete(advantages, advantages.indexOf(advantage))"
        >
          <trash-icon/>
        </button>
      </div>

    </div>
    <div class="scrolling-list-footer">
      <button v-on:click="addAdvantage()">Add Advantage</button>
      <button v-on:click="deleteIsVisible = !deleteIsVisible">
        <span v-if="deleteIsVisible">Done Deleting</span>
        <span v-else>Delete</span>
      </button>
    </div>
  </boxed-section>
</template>

<script>
  import {newBlankAdvantage} from "../js/heroSheetVersioning.js";

  const standardAdvantages = require("../data/standardAdvantages.json");

  export default {
    name: "Advantages",
    props: {
      advantages: { type: Array, required: true }
    },
    data: function() {
      return {
        deleteIsVisible: false
      }
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
      standardAdvantage: function(advantage) {
        const result = standardAdvantages[advantage.name];
        if (result) {
          return result;
        } else {
          // Return a dummy value for invalid advantages
          return {
            isRanked: false,
            docsURL: null,
            description: "",
            isOutOfSpec: true
          }
        }
      },
      addAdvantage: function() {
        const newAdvantage = newBlankAdvantage();
        this.advantages.push(newAdvantage);
        // FIXME: I should sort the advantages at some point, right?
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
  .inapplicable {
    background-color: var(--inapplicable-color);
  }
  .isOutOfSpec {
    outline: var(--error-color) solid 4px;
    outline-offset: -4px;
  }
  .advantage-type {
    background-color: var(--entry-field);
  }
</style>
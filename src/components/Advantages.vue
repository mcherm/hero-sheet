<template>
  <boxed-section title="Advantages">
    <template v-slot:exhibit>
      <local-cost-display :charsheet="charsheet" extra-label="advantages" :extra-value-function="advantageCost"/>
    </template>
    <div class="advantages-list grid-with-lines" :class="{ 'deleteInvisible': !deleteIsVisible, 'deleteVisible': deleteIsVisible}">
      <div class="col-label">Advantage</div>
      <div class="col-label">Ranks</div>
      <div class="col-label">Effect</div>
      <div class="col-label">Description</div>
      <div v-if="deleteIsVisible" class="grid-with-lines-no-lines"></div>

      <div
          v-for="advantage in charsheet.advantages"
          :key="advantage.name"
          class="display-contents"
      >
        <div class="advantage-type" :class="{isOutOfSpec: standardAdvantage(advantage).isOutOfSpec}">
          <select :value="advantage.name" @change="setAdvantageName(advantage, $event.target.value)">
            <option v-if="advantage.name === ''" disabled value="">Select One</option>
            <option v-else :value="advantage.name">{{advantage.name}}</option>
            <option
                v-for="standardAdvantage in unusedStandardAdvantages"
                :key="standardAdvantage.name"
                :value="standardAdvantage.name"
            >{{standardAdvantage.name}}</option>
          </select>
        </div>
        <number-entry v-if="advantageIsRanked(advantage)" v-model="advantage.ranks"/>
        <div v-else class="inapplicable"></div>
        <div :class="{isOutOfSpec: standardAdvantage(advantage).isOutOfSpec}">
          {{standardAdvantage(advantage).description}}
          <docs-lookup :docsURL="standardAdvantage(advantage).docsURL"/>
        </div>
        <string-entry v-model="advantage.description"/>
        <button
            v-if="deleteIsVisible"
            class="trash-button grid-with-lines-no-lines"
            v-on:click="deleteAdvantage(advantage)"
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
  import LocalCostDisplay from "./LocalCostDisplay";

  import {newBlankAdvantage} from "../js/heroSheetVersioning.js";
  import {advantageIsRanked, advantageCost} from "../js/heroSheetUtil";

  const standardAdvantages = require("../data/standardAdvantages.json");

  export default {
    name: "Advantages",
    components: {
      LocalCostDisplay
    },
    props: {
      charsheet: { type: Object, required: true }
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
        for (const advantage of this.charsheet.advantages) {
          advantageInUse[advantage.name] = true;
        }
        return Object.values(standardAdvantages).filter(
          x => !advantageInUse[x.name]);
      }
    },
    methods: {
      advantageCost,
      advantageIsRanked,
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
      setAdvantageName: function(advantage, newAdvantageName) {
        // -- Change the name --
        advantage.name = newAdvantageName;
        // -- Create (or remove) the ranks entry --
        if (advantageIsRanked(advantage)) {
          if (advantage.ranks === null) {
            advantage.ranks = 1;
          }
        } else {
          advantage.ranks = null;
        }
        // -- Create an updater if appropriate --
        if (advantage.name === "Improved Initiative") {
          this.$emit("newUpdater", {updater: "ImprovedInitiativeUpdater", advantage: advantage});
        }
        // -- Sort, but with empty strings at the end --
        const sortFunc = (x, y) => {
          if (x.name === "" && y.name !== "") {
            return 1;
          } else if (x.name !== "" && y.name === "") {
            return -1;
          } else if (x.name === "" && y.name === "") {
            return 0;
          } else {
            return x.name.localeCompare(y.name);
          }
        };
        this.charsheet.advantages.sort(sortFunc);
      },
      addAdvantage: function() {
        const newAdvantage = newBlankAdvantage();
        this.charsheet.advantages.push(newAdvantage);
      },
      deleteAdvantage: function(advantage) {
        // -- Delete it --
        const advantages = this.charsheet.advantages;
        this.$delete(advantages, advantages.indexOf(advantage));
        // -- If there's an updater, delete that --
        if (advantage.name === "Improved Initiative") {
          console.log(`need to delete an ImprovedInitiativeUpdater`); // FIXME: Remove
          this.$emit("deleteUpdater", {updater: "ImprovedInitiativeUpdater", advantageHsid: advantage.hsid});
        }
      }
    }
  }
</script>

<style scoped>
  .advantages-list.deleteVisible {
    grid-template-columns: max-content max-content 2fr 2fr max-content;
  }
  .advantages-list.deleteInvisible {
    grid-template-columns: max-content max-content 2fr 2fr;
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

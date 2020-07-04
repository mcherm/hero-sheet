<template>
  <boxed-section title="Advantages">
    <template v-slot:exhibit>
      <local-cost-display extra-label="advantages" :extra-value-function="advantageCost"/>
    </template>
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
        <number-entry v-if="advantageIsRanked(advantage)" v-model="advantage.ranks" :mutable="advantage.name !== 'Sidekick'"/>
        <div v-else class="inapplicable"></div>
        <div :class="{isOutOfSpec: standardAdvantage(advantage).isOutOfSpec}">
          {{standardAdvantage(advantage).description}}
          <docs-lookup :docsURL="standardAdvantage(advantage).docsURL"/>
          <button
            v-if="advantage.name === 'Sidekick'"
            class="show-ally"
            @click="$emit('show-ally', advantage.allyHsid)"
          >Sidekick</button>
        </div>
        <string-entry v-model="advantage.description"/>
        <button
            v-if="deleteIsVisible"
            class="trash-button grid-with-lines-no-lines"
            v-on:click="onDelete(advantage)"
        >
          <trash-icon/>
        </button>
      </div>

      <div class="empty-notice" v-if="advantages.length === 0">No Advantages</div>
    </div>
    <div class="scrolling-list-footer">
      <button v-on:click="addAdvantage()">Add Advantage</button>
      <button v-if="advantages.length > 0" v-on:click="deleteIsVisible = !deleteIsVisible">
        <span v-if="deleteIsVisible">Done Deleting</span>
        <span v-else>Delete</span>
      </button>
    </div>
  </boxed-section>
</template>

<script>
  import LocalCostDisplay from "./LocalCostDisplay";

  import {newBlankAdvantage, makeNewAlly} from "../js/heroSheetVersioning.js";
  import {advantageCost, advantageIsRanked} from "../js/heroSheetUtil";

  const standardAdvantages = require("../data/standardAdvantages.json");

  export default {
    name: "Advantages",
    components: {
      LocalCostDisplay
    },
    inject: ["getCharsheet"],
    data: function() {
      return {
        deleteIsVisible: false,
        advantages: this.getCharsheet().advantages
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
        // -- Remember the old name --
        const previousName = advantage.name;
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
        // -- Clean up from special features that don't apply --
        if (previousName !== newAdvantageName) {
          if (previousName === "Sidekick") {
            this.$delete(advantage, "allyHsid");
          }
        }
        // -- Create an updater or special features if appropriate --
        if (advantage.name === "Improved Initiative") {
          const updaterEvent = {
            charsheet: this.getCharsheet(),
            updater: "ImprovedInitiativeUpdater",
            advantage: advantage
          };
          this.$globals.eventBus.$emit("new-updater", updaterEvent);
        } else if (advantage.name === "Jack-of-All-Trades") {
          let updaterEvent = {
            charsheet: this.getCharsheet(),
            updater: "JackOfAllTradesUpdater",
            advantage: advantage
          };
          this.$globals.eventBus.$emit("new-updater", updaterEvent);
        } else if (advantage.name === "Sidekick") {
          const newAlly = makeNewAlly(this.getCharsheet(), "sidekick");
          this.$set(advantage, "allyHsid", newAlly.hsid);
          const newAllyInfo = {
            parentCharsheet: this.getCharsheet(),
            allyHsid: newAlly.hsid
          };
          this.$globals.eventBus.$emit("new-ally", newAllyInfo); // creates updaters & such
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
        this.advantages.sort(sortFunc);
      },
      addAdvantage: function() {
        const newAdvantage = newBlankAdvantage();
        this.advantages.push(newAdvantage);
      },
      onDelete: function(advantage) {
        this.$delete(this.advantages, this.advantages.indexOf(advantage));
        if (this.advantages.length === 0) {
          this.deleteIsVisible = false;
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
  button.show-ally {
    margin: 3px 5px;
  }
</style>

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
          <select-entry
              :value="advantage.name"
              @input="setAdvantageName(advantage, $event)"
              unselectedItem="Select One"
              :options="(advantage.name === '' ? [] : [advantage.name]).concat(unusedStandardAdvantages.map(x => x.name))"
          />
        </div>
        <number-entry v-if="advantageIsRanked(advantage)" v-model="advantage.ranks" :mutable="!allyAdvantages.includes(advantage.name)"/>
        <div v-else class="inapplicable"></div>
        <div :class="{isOutOfSpec: standardAdvantage(advantage).isOutOfSpec}">
          {{standardAdvantage(advantage).description}}
          <docs-lookup :docsURL="standardAdvantage(advantage).docsURL"/>
          <edit-button
            v-if="allyAdvantages.includes(advantage.name)"
            class="show-ally"
            :onClick="() => $emit('show-ally', advantage.allyHsid)"
            :isNavigation="true"
          >{{advantage.name}}</edit-button>
        </div>
        <string-entry v-model="advantage.description"/>
        <edit-button
            v-if="deleteIsVisible"
            class="trash-button grid-with-lines-no-lines"
            :onClick="() => onDelete(advantage)"
        >
          <trash-icon/>
        </edit-button>
      </div>

      <div class="empty-notice" v-if="advantages.length === 0">No Advantages</div>
    </div>
    <div class="scrolling-list-footer">
      <edit-button :onClick="addAdvantage">Add Advantage</edit-button>
      <edit-button v-if="advantages.length > 0" :onClick="() => deleteIsVisible = !deleteIsVisible">
        <span v-if="deleteIsVisible">Done Deleting</span>
        <span v-else>Delete</span>
      </edit-button>
    </div>
  </boxed-section>
</template>

<script>
  import LocalCostDisplay from "./LocalCostDisplay";

  import {newBlankAdvantage, makeNewAlly, allyAdvantages} from "../js/heroSheetVersioning.js";
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
        advantages: this.getCharsheet().advantages,
        allyAdvantages,
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
          x => !advantageInUse[x.name]
        );
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
          if (allyAdvantages.includes(previousName)) {
            this.$delete(advantage, "allyHsid");
          }
        }
        // -- Create an updater or special features if appropriate --
        const advantageUpdaterName = standardAdvantages[advantage.name].advantageUpdater;
        if (advantageUpdaterName) {
          const updaterEvent = {
            charsheet: this.getCharsheet(),
            updater: advantageUpdaterName,
            advantage: advantage
          };
          this.$globals.eventBus.$emit("new-updater", updaterEvent);
        }
        if (allyAdvantages.includes(advantage.name)) {
          const newAlly = makeNewAlly(this.getCharsheet(), advantage.name.toLowerCase());
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
    margin: 0;
    background-color: var(--paper-color);
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

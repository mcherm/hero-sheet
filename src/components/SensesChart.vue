<template>
  <div class="senses">
    <div class="sense-type-stack">
      <div v-for="senseType in senses" class="sense-type">
        <div class="sense-type-header">
          <span class="sense-type-name">{{senseType.name}}</span>
          <senses-chart-quality-list
              :qualities="senseType.qualities"
              :added-qualities="power.extended.addedSenseTypeQualities"
              :power-hsid="power.hsid"
              :sense-type-name="senseType.name"
              :mutable="mutable"
          />
        </div>
        <div v-for="sense in senseType.senses" class="sense-chart-row">
          <div class="sense" :class="{'created-here': isSenseCreatedHere(sense)}">
            <span class="sense-name">
              {{sense.name}}
              <span v-if="isSenseCreatedHere(sense)">({{costOfSense(sense)}})</span>
            </span>
            <senses-chart-quality-list
                :qualities="sense.qualities"
                :added-qualities="power.extended.addedSenseQualities"
                :power-hsid="power.hsid"
                :sense-type-name="senseType.name"
                :sense-hsid="sense.hsid"
                :mutable="mutable"
            />
          </div>
          <div v-if="isRemovingSense && isSenseCreatedHere(sense)" v-on:click="deleteSense(senseType, sense)">
            <trash-icon/>
          </div>
        </div>
      </div>
    </div>
    <div v-if="isAddingSense" class="new-sense-creator">
      <select-entry
          class="new-sense-select-sense"
          :value="newSenseName"
          :options="newSenseOptions"
          @input="setNewSenseName($event)"
          unselectedItem="Select One"
      />
      <select-entry
          v-if="newSenseSenseTypesAllowed !== null"
          class="new-sense-type"
          v-model="newSenseSenseType"
          :options="newSenseSenseTypesAllowed"
          unselectedItem="Select One"
      />
      <span v-if="newSenseIsComplete">({{costOfNewSense}})</span>
      <edit-button :onClick="() => addNewSense()" :disabled="!newSenseIsComplete" class="first-new-sense-button">Create</edit-button>
      <edit-button :onClick="() => isAddingSense = false">Cancel</edit-button>
    </div>
    <div v-if="mutable && !isAddingSense" class="button-bar">
      <edit-button
          v-if="!isRemovingSense"
          :onClick="() => {setNewSenseName(''); isAddingSense = true}"
      >Add Sense</edit-button>
      <edit-button
          v-if="!isRemovingSense && someSenseIsRemovableHere()"
          :onClick="() => isRemovingSense = true"
      >Delete Sense</edit-button>
      <edit-button
          v-if="isRemovingSense"
          :onClick="() => isRemovingSense = false"
      >Done Deleting</edit-button>
    </div>
  </div>
</template>

<script>
  import SensesChartQualityList from "./SensesChartQualityList.vue";
  import {newHsid} from "@/js/heroSheetVersioning.js";
  const sensesData = require("@/data/sensesData.json");

  const allSelectableSenseTypeNames = Object.values(sensesData.senseTypes).filter(x => x.selectable).map(x => x.name);

  export default {
    name: "SensesChart",
    components: {
      SensesChartQualityList,
    },
    props: {
      power: { type: Object, required: false, default: null },
      mutable: { type: Boolean, required: false, default: true }
    },
    inject: ["getCharsheet"],
    data: function() {
      return {
        isAddingSense: false,
        isRemovingSense: false,
        senses: this.getCharsheet().senses,
        newSenseName: "",
        newSenseSenseType: "",
        newSenseSenseTypesAllowed: null, // either a list of the sense types the new sense is allowed to have, or null if the list is undetermined
      }
    },
    computed: {
      costOfNewSense: function() {
        return sensesData.senses[this.newSenseName].cost;
      },
      newSenseOptions: function() {
        return Object.values(sensesData.senses)
            .map(x =>
                !x.isInherentSense && (x.allowMultiples || !this.hasSense(x.name))
                    ? x.name
                    : null
            )
            .filter(x => x !== null);
      },
      newSenseIsComplete: function() {
        const newSenseData = sensesData.senses[this.newSenseName];
        if (newSenseData === undefined) {
          return false;
        }
        if (this.newSenseSenseType === "") {
          return false;
        }
        return true;
      },
    },
    methods: {
      /* Given a senseName, returns true if the character has that sense; false if not. */
      hasSense: function(senseName) {
        for (const senseType of Object.values(this.senses)) {
          for (const sense of senseType.senses) {
            if (sense.name === senseName) {
              return true;
            }
          }
        }
        return false;
      },
      /* Returns true if at least one sense can be deleted. */
      someSenseIsRemovableHere: function() {
        for (const senseType of Object.values(this.senses)) {
          for (const sense of senseType.senses) {
            if (this.isSenseCreatedHere(sense)) {
              return true;
            }
          }
        }
        return false;
      },
      /*
       * Return true if the sense is from the current power and thus can be edited within this senses chart.
       */
      isSenseCreatedHere: function(sense) {
        if (sense.sourceFeatureHsid !== this.power.hsid ) {
          return false;
        }
        return this.power.extended.addedSenses.some(x => x.hsid === sense.sourceHsid);
      },
      costOfSense: function(sense) {
        return sensesData.senses[sense.name].cost;
      },
      /*
       * Removes the sense.
       */
      deleteSense: function(senseType, sense) {
        // -- Remove from power added senses --
        const addedSenses = this.power.extended.addedSenses;
        const powerPositionToDelete = addedSenses.findIndex(x => x.hsid === sense.sourceHsid);
        if (powerPositionToDelete !== -1) {
          this.$delete(addedSenses, powerPositionToDelete);
        }
        // -- Exit removal mode if there is nothing else we can remove --
        if (!this.someSenseIsRemovableHere()) {
          this.isRemovingSense = false;
        }
      },
      setNewSenseName: function(senseName) {
        this.newSenseName = senseName;
        const newSenseData = sensesData.senses[senseName];
        if (newSenseData === undefined) {
          this.newSenseSenseTypesAllowed = null;
          this.newSenseSenseType = "";
        } else {
          const newSenseType = newSenseData.senseType;
          if (newSenseType === "Any") { // any sense type allowed
            this.newSenseSenseTypesAllowed = allSelectableSenseTypeNames;
            this.newSenseSenseType = "";
          } else { // only a single sense type allowed
            this.newSenseSenseTypesAllowed = [newSenseType];
            this.newSenseSenseType = newSenseType;
          }
        }
      },
      addNewSense: function() {
        this.isAddingSense = false;
        const newSenseInPower = {
          "sense": this.newSenseName,
          "senseType": this.newSenseSenseType,
          "hsid": newHsid(),
        };
        this.power.extended.addedSenses.push(newSenseInPower);
      },
    }
  }
</script>

<style scoped>
  .sense-type-stack {
    display: flex;
    flex-direction: column;
    border: 1px solid var(--box-border-color);
  }

  .sense-type {
  }

  .sense-type-header {
    background-color: var(--subtle-shade-color);
    padding: 2px;
    display: flex;
    align-items: center;
    flex-grow: 1;
  }

  .sense-type-name {
    margin: 2px 15px 2px 2px;
  }

  .sense-chart-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .new-sense-creator {
    border: 1px solid var(--box-border-color);
    display: flex;
    align-items: center;
    background: var(--entry-field);
  }

  .new-sense-select-sense {
    margin: 2px 4px 2px 10px;
  }

  .first-new-sense-button {
    margin-left: 10px;
  }

  .button-bar {
    display: flex;
    justify-content: center;
  }

  .sense {
    padding: 2px;
    display: flex;
    align-items: center;
    flex-grow: 1;
  }

  .sense-name {
    margin: 2px 15px 2px 12px;
  }

  .sense.created-here {
    background: var(--entry-field);
  }
</style>

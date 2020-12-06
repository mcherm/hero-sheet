<template>
  <div class="senses">
    <div class="sense-type-stack">
      <div v-for="senseType in senses" class="sense-type">
        <div class="sense-type-header">{{senseType.name}}</div>
        <div v-for="sense in senseType.senses" class="sense-chart-row" :class="{'sense-editable': isSenseDeletableHere(sense)}">
          <senses-chart-sense :sense="sense" :mutable="mutable"/>
          <div v-if="isRemovingSense && isSenseDeletableHere(sense)" v-on:click="deleteSense(senseType, sense)">
            <trash-icon/>
          </div>
        </div>
      </div>
    </div>
    <div v-if="isAddingSense" class="new-sense-creator">
      <select-entry
          :value="newSenseName"
          :options="newSenseOptions"
          unselectedItem="Select One"
          @input="setNewSenseName($event)"
          class="new-sense-select-sense"
      />
      <div v-if="newSenseSenseType !== null" class="new-sense-type">{{newSenseSenseType}}</div>
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
  import SensesChartSense from "./SensesChartSense.vue";
  import {newHsid} from "../js/heroSheetVersioning.js";
  const sensesData = require("@/data/sensesData.json");

  export default {
    name: "SensesChart",
    components: {
      SensesChartSense,
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
        senses: { // FIXME: It should be read from the charsheet, not hardcoded
          "Visual": {
            "name": "Visual",
            "senses": [
              {
                "name": "Normal Vision",
                "hsid": "HIBM32D1V",
                "qualities": [
                  { "name": "Accurate", },
                  { "name": "Acute" },
                  { "name": "Ranged" },
                ]
              },
              {
                "name": "Infravision",
                "sourceHsid": "HIPS21E13",
                "qualities": [
                  { "name": "Accurate" },
                  { "name": "Acute" },
                  { "name": "Ranged" },
                ]
              }
            ],
            "qualities": [
              {
                "name": "Low Light",
                "sourceHsid": "HIRNWDYKE"
              },
            ]
          },
          "Auditory": {
            "name": "Auditory",
            "senses": [
              {
                "name": "Normal Hearing",
                "hsid": "HIBM32D1V",
                "qualities": [
                  { "name": "Acute" },
                  { "name": "Radius" },
                  { "name": "Ranged" },
                  {
                    "name": "Rapid",
                    "ranks": 2,
                    "sourceHsid": "HIVDVETL6"
                  },
                  {
                    "name": "Penetrates Concealment",
                    "sourceHsid": "HINC8D3G8"
                  },
                ]
              }
            ],
            "qualities": []
          },
          "Olfactory": {
            "name": "Olfactory",
            "senses": [
              {
                "name": "Normal Smell/Taste",
                "hsid": "HIS8Q8CN9",
                "qualities": [
                  { "name": "Radius" },
                ]
              }
            ],
            "qualities": []
          },
          "Tactile": {
            "name": "Tactile",
            "senses": [
              {
                "name": "Normal Touch",
                "hsid": "HIPC11GKW",
                "qualities": [
                  { "name": "Accurate" },
                  { "name": "Radius" },
                ]
              }
            ],
            "qualities": []
          },
          "Mental": {
            "name": "Mental",
            "senses": [
              {
                "name": "Normal Mental Awareness",
                "hsid": "HIQ1JK369",
                "qualities": []
              }
            ],
            "qualities": []
          }
        },
        newSenseName: "",
        newSenseSenseType: null,
      }
    },
    computed: {
      newSenseOptions: function() {
        return Object.values(sensesData.senses)
            .map(x =>
                (
                    !x.isInherentSense &&
                    !this.hasSense(x.name)
                )
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
        // FIXME: Should consider additional data needed, like type or ranks
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
            if (this.isSenseDeletableHere(sense)) {
              return true;
            }
          }
        }
        return false;
      },
      /*
       * Return true if the sense is from the current power and thus can be edited within this senses chart.
       */
      isSenseDeletableHere: function(sense) {
        return sense.sourceHsid !== undefined; // FIXME: Real test needed
      },
      /*
       * Removes the sense.
       */
      deleteSense: function(senseType, sense) {
        const positionToDelete = senseType.senses.indexOf(sense);
        if (positionToDelete !== -1) {
          this.$delete(senseType.senses, positionToDelete);
        }
        if (senseType.senses.length === 0) {
          this.$delete(this.senses, senseType.name);
        }
        if (!this.someSenseIsRemovableHere()) {
          this.isRemovingSense = false;
        }
      },
      setNewSenseName: function(senseName) {
        this.newSenseName = senseName;
        const newSenseData = sensesData.senses[senseName];
        // FIXME: In the future some won't be a fixed type
        this.newSenseSenseType = newSenseData === undefined ? null : newSenseData.senseType;
      },
      addNewSense: function() {
        this.isAddingSense = false;
        const newSenseData = sensesData.senses[this.newSenseName];
        let senseType = this.senses[this.newSenseSenseType];
        if (senseType === undefined) {
          senseType = {
            name: this.newSenseSenseType,
            senses: [],
            qualities: [],
          };
          this.$set(this.senses, this.newSenseSenseType, senseType);
        }
        const newSense = {
          "name": this.newSenseName,
          "sourceHsid": newHsid(),
          "qualities": newSenseData.defaultQualities.map(x => {
            return { name: x }
          }),
        };
        // FIXME: This should really add to the POWER, not the stub data
        senseType.senses.push(newSense);
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
</style>

<template>
  <div class="power">
    <div class="flex-row">
      <div class="power-features">
        <label class="row-label">Name</label>
        <string-entry
            :value="power.name"
            :mutable="mutable"
            @input="$emit('update:name', $event)"
        />

        <label class="row-label">Effect</label>
        <div>
          <power-effect-select :value="power.effect" @input="setPowerEffect($event)" :mutable="mutable"/>
        </div>

        <label class="row-label">Basic Desc</label>
        <div>
          <span>{{power.effectDescription}}</span>
          <docs-lookup v-if="getStandardPower()" :docsURL="getStandardPower().docsURL"/>
        </div>

        <div v-if="hasOptions()" class="display-contents">
          <label class="row-label">Option</label>
          <div>
            <select :value="power.option" v-on:change="setPowerOption($event.target.value)">
              <option
                  v-for="powerOption in getStandardPower().powerOptions"
                  :key="powerOption.name"
                  :value="powerOption.name"
              >
               {{powerOption.name}}
              </option>
            </select>
          </div>

          <label class="row-label">Option Desc</label>
          <div>{{theOption().description}}</div>
        </div>

        <label class="row-label">Extras</label>
        <modifier-list :power="power" modifierType="extras" :mutable="mutable"/>

        <label class="row-label">Flaws</label>
        <modifier-list :power="power" modifierType="flaws" :mutable="mutable"/>

        <label class="row-label">Description</label>
        <string-entry v-model="power.description" :mutable="mutable"/>
      </div>
      <div class="power-costs">
        <label v-if="!isArray()" class="row-label">Power</label>
        <number-display v-if="!isArray()" :value="power.baseCost"/>

        <label class="row-label">Extras</label>
        <number-display :value="powerCostCalculations.extrasMultiplier"/>

        <label class="row-label">Flaws</label>
        <number-display :value="powerCostCalculations.flawsMultiplier" :show-err-for-negatives="false"/>

        <label v-if="!isArray()" class="row-label">Ranks</label>
        <number-entry v-if="!isArray()" :value="power.ranks" @input="setPowerRanks($event)" :mutable="mutable"/>

        <label class="row-label">Flats</label>
        <number-display :value="powerCostCalculations.flatAdder" :show-err-for-negatives="false"/>

        <label class="row-label">Cost</label>
        <number-display :value="power.cost"/>
      </div>
    </div>
    <div v-if="isArray()" class="subpower-list">
      <div class="scrolling-list-header">Array Powers</div>
      <power-list :powers="power.subpowers" v-on:newUpdater="$emit('newUpdater', $event)" :mutable="mutable" />
    </div>
  </div>
</template>

<script>
  import ModifierList from "./ModifierList.vue";
  import PowerEffectSelect from "./PowerEffectSelect.vue";
  import {STARTING_POWER_NAME} from "../js/heroSheetVersioning.js";
  import {powerCostCalculate, getStandardPower, getPowerOption, recalculatePowerBaseCost, setPowerEffect, setPowerOption, powerUpdaterEvent, buildFeature, replacePower} from "../js/heroSheetUtil.js";
  const samplePowers = require("../data/samplePowers.json");

  export default {
    name: "Power",
    components: {
      ModifierList,
      PowerEffectSelect
    },
    props: {
      power: { type: Object, required: true },
      mutable: { type: Boolean, required: false, default: true }
    },
    created: function() {
      this.$watch("power.subpowers", function() {
        recalculatePowerBaseCost(this.power);
        this.recalculatePowerCost();
      }, { deep: true });
    },
    computed: {
      powerCostCalculations: function() {
        return powerCostCalculate(this.power);
      }
    },
    methods: {
      getStandardPower: function() {
        return getStandardPower(this.power);
      },
      isArray: function() {
        return this.getStandardPower() && this.getStandardPower().isArray;
      },
      hasOptions: function() {
        return Boolean(this.getStandardPower() && this.getStandardPower().powerOptions);
      },
      theOption: function() {
        return getPowerOption(this.power);
      },
      setPowerEffect: function(effectSelection) {
        const [selectType, effect] = effectSelection.split("|");
        if (selectType === "standard") {
          setPowerEffect(this.power, effect);
        } else if (selectType === "sample") {
          const samplePower = samplePowers[effect];
          const newFeature = buildFeature(samplePower.feature);
          // Keep the existing name if it looks like it has been edited
          if (!this.power.name.startsWith(STARTING_POWER_NAME)) {
            newFeature.name = this.power.name;
          }
          // Keep the existing number of ranks if ranks were not explicitly listed
          // in the template (except for subpowers which are just too hard to deal with).
          if (!(samplePower.feature.ranks)) {
            newFeature.ranks = this.power.ranks;
          }
          replacePower(this.power, newFeature);
          const recursivelyCreateNewUpdaters = powerList => {
            for (const power of powerList) {
              const event = powerUpdaterEvent(power);
              if (event !== null) {
                this.$emit("newUpdater", event);
              }
              if (power.subpowers.length > 0) {
                recursivelyCreateNewUpdaters(power.subpowers);
              }
            }
          }
          recursivelyCreateNewUpdaters(newFeature.subpowers);
        } else {
          throw new Error(`Invalid selectType of '${selectType}'.`);
        }
        this.recalculatePowerCost();
        this.potentiallyCreateNewUpdaters();
        this.$emit('update:name', this.power.name); // Allow the containing list to rename for uniqueness
      },
      setPowerOption: function(option) {
        setPowerOption(this.power, option);
        this.recalculatePowerCost();
        this.potentiallyCreateNewUpdaters();
      },
      setPowerRanks: function(ranks) {
        this.power.ranks = ranks;
        this.recalculatePowerCost();
      },
      recalculatePowerCost: function() {
        const costCalcs = powerCostCalculate(this.power);
        if (this.power.cost !== costCalcs.cost) {
          this.power.cost = costCalcs.cost;
        }
      },
      potentiallyCreateNewUpdaters: function() {
        const event = powerUpdaterEvent(this.power);
        if (event !== null) {
          this.$emit("newUpdater", event);
        }
      }
    }
  }
</script>

<style scoped>
  div.power {
    border: 1px solid var(--grid-line-color);
    padding: 5px;
    margin: 5px;
    background-color: var(--paper-color);
  }
  .flex-row {
    display: flex;
    flex-direction: row;
    align-items: flex-start;
  }
  .power-features {
    display: grid;
    grid-template-columns: max-content 1fr;
    grid-gap: 0px 5px;
    flex: 1 1 auto;
  }
  .power-features label {
    text-align:right;
  }
  .power-features label:after {
    content: ":";
  }
  .power-costs {
    display: grid;
    grid-template-columns: max-content max-content;
    grid-gap: 0px 5px;
    flex: 0 1 auto;
    margin-left: 5px;
  }
  div.subpower-list {
    border: 1px solid var(--box-border-color);
    padding: 5px;
    margin: 5px;
    background-color: var(--subsection-color);
  }
  .scrolling-list-header {
    text-align: center;
  }
  .effect-select {
    /* FIXME: The following would be nice, but it's ugly on Firefox Mac */
    /* background-color: var(--entry-field); */
  }
</style>

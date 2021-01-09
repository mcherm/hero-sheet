<template>
  <div class="power" :class="powerStateClasses(power)">
    <div class="flex-row">
      <div class="power-features">
        <label class="row-label">Name</label>
        <string-entry :value="power.name" :mutable="mutable" @input="$emit('update:name', $event)"/>

        <label class="row-label">Effect</label>
        <div>
          <power-effect-select :value="power.effect" @input="setPowerEffect($event)" :mutable="mutable"/>
        </div>

        <label class="row-label">Basic Desc</label>
        <div>
          <span v-if="standardPower !== null">{{standardPower.description}}</span>
          <docs-lookup v-if="standardPower" :docsURL="standardPower.docsURL"/>
        </div>

        <div v-if="standardPower !== null && standardPower.powerLayout === 'senses'" class="display-contents">
          <label class="row-label">Senses</label>
          <power-layout-senses :power="power" :mutable="mutable"/>
        </div>
        <div v-if="standardPower !== null && standardPower.powerLayout === 'affliction'" class="display-contents">
          <label class="row-label">Affliction</label>
          <power-layout-affliction :power="power" :mutable="mutable"/>
        </div>

        <div v-if="standardPower && standardPower.powerOptions" class="display-contents">
          <label class="row-label">Option</label>
          <div>
            <select-entry
                style="display: inline-block"
                :value="power.option"
                :options="Object.values(standardPower.powerOptions).map(x => x.name)"
                unselectedItem="Select One"
                @input="setPowerOption($event)"
            />
          </div>

          <label class="row-label">Option Desc</label>
          <div v-if="theOption() === null" class="inapplicable"></div>
          <div v-else>{{theOption().description}}</div>
        </div>

        <label class="row-label">Extras</label>
        <modifier-list
            :power="power"
            modifierType="extras"
            :inherited-modifier-lists="inheritedModifierLists"
            :mutable="mutable"
        />

        <label class="row-label">Flaws</label>
        <modifier-list
            :power="power"
            modifierType="flaws"
            :inherited-modifier-lists="inheritedModifierLists"
            :mutable="mutable"
        />

        <label class="row-label">Description</label>
        <string-entry v-model="power.description" :mutable="mutable"/>
      </div>
      <div class="power-costs">
        <label v-if="!isArray()" class="row-label">Power</label>
        <number-display v-if="!isArray()" :value="getBaseCost()"/>

        <label class="row-label">Extras</label>
        <number-display :value="powerCostCalculations.extrasMultiplier"/>

        <label class="row-label">Flaws</label>
        <number-display :value="powerCostCalculations.flawsMultiplier" :show-err-for-negatives="false"/>

        <label v-if="!isArray()" class="row-label">Ranks</label>
        <number-entry
            v-if="!isArray()"
            :value="power.ranks"
            @input="setPowerRanks($event)"
            :mutable="mutable && !(standardPower && standardPower.powerLayout === 'senses')"
        />

        <label class="row-label">Flats</label>
        <number-display :value="powerCostCalculations.flatAdder" :show-err-for-negatives="false"/>

        <label class="row-label">Cost</label>
        <number-display :value="power.cost"/>
      </div>
    </div>
    <div v-if="isArray()" class="subpower-list">
      <div class="scrolling-list-header">Array Powers</div>
      <power-list
          :powers="power.subpowers"
          :inherited-modifier-lists="[power.extras, power.flaws, ...inheritedModifierLists]"
          :mutable="mutable"
      />
    </div>
  </div>
</template>

<script>
  import ModifierList from "@/components/ModifierList.vue";
  import PowerEffectSelect from "@/components/PowerEffectSelect.vue";
  import PowerLayoutSenses from "@/components/PowerLayoutSenses.vue";
  import PowerLayoutAffliction from "@/components/PowerLayoutAffliction.vue";
  import {STARTING_POWER_NAME} from "@/js/heroSheetVersioning.js";
  import {
    powerBaseCost, powerCostCalculate, getStandardPower, getPowerOption, setPowerEffect,
    setPowerOption, powerUpdaterEvents, buildFeature, replacePower, powerStateClasses, setFeatureActivation
  } from "@/js/heroSheetUtil.js";
  const samplePowers = require("@/data/samplePowers.json");

  export default {
    name: "Power",
    components: {
      ModifierList,
      PowerEffectSelect,
      PowerLayoutSenses,
      PowerLayoutAffliction,
    },
    inject: ["getCharsheet"],
    props: {
      power: { type: Object, required: true },
      inheritedModifierLists: { type: Array, required: true },
      mutable: { type: Boolean, required: false, default: true },
    },
    created: function() {
      this.$watch("power.subpowers", function() {
        this.recalculatePowerCost();
      }, { deep: true });
    },
    computed: {
      powerCostCalculations: function() {
        return powerCostCalculate(this.power, this.inheritedModifierLists);
      },
      standardPower: function() {
        return getStandardPower(this.power);
      }
    },
    methods: {
      powerStateClasses,
      isArray: function() {
        return this.standardPower && this.standardPower.powerLayout === "array";
      },
      theOption: function() {
        return getPowerOption(this.power);
      },
      getBaseCost: function() {
        return powerBaseCost(this.power);
      },
      setPowerEffect: function(effectSelection) {
        const [selectType, effect] = effectSelection.split("|");
        if (selectType === "standard") {
          setPowerEffect(this.power, this.inheritedModifierLists, effect);
        } else if (selectType === "sample") {
          const samplePower = samplePowers[effect];
          const newFeature = buildFeature(samplePower.feature, this.inheritedModifierLists);
          // Keep the existing name if it looks like it has been edited
          if (!this.power.name.startsWith(STARTING_POWER_NAME)) {
            newFeature.name = this.power.name;
          }
          // Keep the existing number of ranks if ranks were not explicitly listed
          // in the template (except for subpowers which are just too hard to deal with).
          if (!(samplePower.feature.ranks)) {
            newFeature.ranks = this.power.ranks;
          }
          replacePower(this.power, this.inheritedModifierLists, newFeature);
          const recursivelyCreateNewUpdaters = powerList => {
            for (const power of powerList) {
              const events = powerUpdaterEvents(this.getCharsheet(), power);
              for (const event of events) {
                this.$globals.eventBus.$emit("new-updater", event);
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
        setFeatureActivation(this.getCharsheet(), this.power, this.inheritedModifierLists, "on");
        this.$emit('update:name', this.power.name); // Allow the containing list to rename for uniqueness
      },
      setPowerOption: function(option) {
        setPowerOption(this.power, this.inheritedModifierLists, option);
        this.potentiallyCreateNewUpdaters();
        setFeatureActivation(this.getCharsheet(), this.power, this.inheritedModifierLists, "on");
      },
      setPowerRanks: function(ranks) {
        this.power.ranks = ranks;
        this.recalculatePowerCost();
      },
      recalculatePowerCost: function() {
        const costCalcs = powerCostCalculate(this.power, this.inheritedModifierLists);
        if (this.power.cost !== costCalcs.cost) {
          this.$set(this.power, "cost", costCalcs.cost);
        }
      },
      potentiallyCreateNewUpdaters: function() {
        const powerOptions = this.standardPower.powerOptions;
        const noOptionNeeded = (!powerOptions) || powerOptions.length === 0;
        const powerIsFullySpecified = this.power.effect !== "" && (noOptionNeeded || getPowerOption(this.power) !== null);
        if (powerIsFullySpecified) {
          const events = powerUpdaterEvents(this.getCharsheet(), this.power);
          for (const event of events) {
            this.$globals.eventBus.$emit("new-updater", event);
          }
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
  div.power.off {
    border-style: dashed;
    background-color: var(--subtle-shade-color);
  }
  div.power.partial {
    border-style: dotted;
  }
  div.power.partial.off {
    border-style: dotted;
  }
  .flex-row {
    display: flex;
    flex-direction: row;
    align-items: flex-start;
  }
  .power-features {
    display: grid;
    grid-template-columns: max-content 1fr;
    grid-gap: 0 5px;
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
    grid-gap: 0 5px;
    flex: 0 1 auto;
    margin-left: 5px;
  }
  div.power.off .power-costs > .number-display {
    background-color: var(--subtle-shade-color);
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
</style>

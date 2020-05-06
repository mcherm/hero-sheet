<template>
  <div class="power">
    <div class="flex-row">
      <div class="power-features">
        <label class="row-label">Name</label>
        <string-entry
            :value="power.name"
            @input="$emit('update:name', $event)"
        />

        <label class="row-label">Effect</label>
        <div>
          <power-effect-select :value="power.effect" @input="setPowerEffect($event)"/>
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
        <modifier-list modifierType="extras" :modifiers="power.extras" :standardPower="getStandardPower()"/>

        <label class="row-label">Flaws</label>
        <modifier-list modifierType="flaws" :modifiers="power.flaws" :standardPower="getStandardPower()"/>

        <label class="row-label">Description</label>
        <string-entry v-model="power.description"/>
      </div>
      <div class="power-costs">
        <label v-if="!isArray()" class="row-label">Power</label>
        <number-display v-if="!isArray()" :value="power.baseCost"/>

        <label class="row-label">Extras</label>
        <number-display :value="extrasMultiplier"/>

        <label class="row-label">Flaws</label>
        <number-display :value="flawsMultiplier" :show-err-for-negatives="false"/>

        <label v-if="!isArray()" class="row-label">Ranks</label>
        <number-entry v-if="!isArray()" :value="power.ranks" @input="setPowerRanks($event)"/>

        <label class="row-label">Flats</label>
        <number-display :value="flatAdder" :show-err-for-negatives="false"/>

        <label class="row-label">Cost</label>
        <number-display :value="power.cost"/>
      </div>
    </div>
    <div v-if="isArray()" class="subpower-list">
      <div class="scrolling-list-header">Array Powers</div>
      <power-list :powers="power.subpowers" v-on:newUpdater="$emit('newUpdater', $event)" />
    </div>
  </div>
</template>

<script>
  import ModifierList from "./ModifierList";
  import PowerEffectSelect from "./PowerEffectSelect";
  import {powerCostCalculate, getStandardPower, getPowerOption, recalculatePowerBaseCost, setPowerEffect, setPowerOption} from "../js/heroSheetUtil.js";

  export default {
    name: "Power",
    components: {
      ModifierList,
      PowerEffectSelect
    },
    props: {
      power: { type: Object, required: true },
    },
    data: function() {
      return {
        extrasMultiplier: 0,
        flawsMultiplier: 0,
        flatAdder: 0
      }
    },
    created: function() {
      this.$watch("power.subpowers", function() {
        recalculatePowerBaseCost(this.power);
        this.recalculatePowerCost();
      }, { deep: true });
      this.$watch("power.extras", function() {
        this.recalculatePowerCost();
      }, { deep: true });
      this.$watch("power.flaws", function() {
        this.recalculatePowerCost();
      }, { deep: true });
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
      setPowerEffect: function(effect) {
        setPowerEffect(this.power, effect);
        this.recalculatePowerCost();
        this.potentiallyCreateNewUpdaters();
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
        this.extrasMultiplier = costCalcs.extrasMultiplier;
        this.flawsMultiplier = costCalcs.flawsMultiplier;
        this.flatAdder = costCalcs.flatAdder;
        if (this.power.cost !== costCalcs.cost) {
          this.power.cost = costCalcs.cost;
        }
      },
      potentiallyCreateNewUpdaters: function() {
        // FIXME: Should combine this with code in PowerList and pull it out somewhere
        if (this.power.effect === "Damage") {
          this.$emit("newUpdater", { updater: "DamagePowerAttackUpdater", power: this.power });
        } else if (this.power.effect === "Affliction") {
          this.$emit("newUpdater", { updater: "AfflictionPowerAttackUpdater", power: this.power });
        } else if (this.power.effect === "Nullify") {
          this.$emit("newUpdater", { updater: "NullifyPowerAttackUpdater", power: this.power });
        } else if (this.power.effect === "Weaken") {
          this.$emit("newUpdater", { updater: "WeakenPowerAttackUpdater", power: this.power });
        } else if (this.power.effect === "Enhanced Trait") {
          this.$emit("newUpdater", { updater: "EnhancedTraitUpdater", power: this.power });
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

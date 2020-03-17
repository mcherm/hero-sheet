<template>
  <div class="power">
    <div class="flex-row">
      <div class="power-features">
        <label class="row-label">Name</label><string-entry
            :value="power.name"
            @input="$emit('update:name', $event)"
        />
        <label class="row-label">Effect</label><div>
          <select v-model="power.effect" class="effect-select">
            <option disabled value="">Select One</option>
            <option
                v-for="standardPower in standardPowers"
                :key="standardPower.name"
                :value="standardPower.name"
            >
              {{standardPower.name}}{{standardPower.isPrimitiveEffect ? "" : "*"}}
            </option>
          </select>
        </div>
        <label class="row-label">Basic Desc</label><div>{{power.effectDescription}}</div>

        <div v-if="hasOptions" class="display-contents">
          <label class="row-label">Option</label>
          <div>
            <select v-model="power.option">
              <option
                  v-for="powerOption in standardPower.powerOptions"
                  :key="powerOption.name"
                  :value="powerOption.name"
              >
               {{powerOption.name}}
              </option>
            </select>
          </div>
          <label class="row-label">Option Desc</label><div>{{theOption.description}}</div>
        </div>

        <label class="row-label">Extras</label><modifier-list modifierType="extras" :modifiers="power.extras"/>
        <label class="row-label">Flaws</label><modifier-list modifierType="flaws" :modifiers="power.flaws"/>
        <label class="row-label">Description</label><string-entry v-model="power.description"/>
      </div>
      <div class="power-costs">
        <label v-if="!isArray" class="row-label">Power</label><div v-if="!isArray">
          <number-display :value="power.baseCost"/>
        </div>
        <label class="row-label">Extras</label><div><number-display :value="extrasMultiplier"/></div>
        <label class="row-label">Flaws</label><div><number-display :value="flawsMultiplier" :show-err-for-negatives="false"/></div>
        <label v-if="!isArray" class="row-label">Ranks</label><div v-if="!isArray">
          <number-entry v-model="power.ranks"/>
        </div>
        <label class="row-label">Flats</label><div><number-display :value="flatAdder" :show-err-for-negatives="false"/></div>
        <label class="row-label">Cost</label><div><number-display :value="power.cost"/></div>
      </div>
    </div>
    <div v-if="isArray" class="subpower-list">
      <div class="scrolling-list-header">Array Powers</div>
      <power-list
          :powers="power.subpowers"
          v-on:newUpdater="$emit('newUpdater', $event)"
          v-on:deleteUpdater="$emit('deleteUpdater', $event)"
      />
    </div>
  </div>
</template>

<script>
  import ModifierList from "./ModifierList";
  import {powerCostCalculate} from "../js/heroSheetUtil.js";

  export default {
    name: "Power",
    components: {
      ModifierList
    },
    props: {
      power: { type: Object, required: true },
      standardPowers: { type: Object, required: true }
    },
    data: function() {
      return {
        extrasMultiplier: 0,
        flawsMultiplier: 0,
        flatAdder: 0
      }
    },
    created: function() { // FIXME: Experiment to see if some of these watches can be done as calculations
      this.$watch("power.effect", function() {
        this.recalculateEffectStuff();
      }, { immediate: true });
      this.$watch("power.ranks", function() {
        this.recalculateCost();
      }, { immediate: true });
      this.$watch("power.subpowers", function() {
        this.recalculateBaseCost();
        this.recalculateCost();
      }, { deep: true });
      this.$watch("power.option", function() {
        this.recalculateBaseCost();
        this.recalculateCost();
      });
      this.$watch("power.extras", function() {
        this.recalculateCost();
      }, { deep: true });
      this.$watch("power.flaws", function() {
        this.recalculateCost();
      }, { deep: true });
    },
    computed: {
      standardPower: function() {
        return this.standardPowers[this.power.effect] || null;
      },
      isArray: function() {
        return this.standardPower && this.standardPower.isArray;
      },
      hasOptions: function() {
        return Boolean(this.standardPower && this.standardPower.powerOptions);
      },
      theOption: function() {
        if (this.standardPower && this.standardPower.powerOptions) {
          return this.standardPower.powerOptions[this.power.option];
        } else {
          return null;
        }
      }
    },
    methods: {
      recalculateEffectStuff: function() {
        const standardPower = this.standardPower;
        if (standardPower === null) {
          this.power.effectDescription = "";
          this.power.baseCost = NaN; // Default to a cost of NaN when the power is unknown
        } else {
          this.power.effectDescription = standardPower.description;
          if (standardPower.powerOptions) {
            if (!this.power.option || !(this.power.option in standardPower.powerOptions)) {
              // Current option is invalid, so re-assign to the first option
              let nameOfFirstPower = null;
              for (let powerName in standardPower.powerOptions) {
                nameOfFirstPower = powerName;
                break;
              }
              this.$set(this.power, "option", nameOfFirstPower);
            }
          } else {
            this.$delete(this.power, "option");
          }
          this.recalculateBaseCost();
        }
        this.recalculateCost();
        if (this.power.effect === "Damage") {
          this.$emit("newUpdater", { updater: "DamagePowerAttackUpdater", power: this.power });
        }
      },
      // If it's an array, this will be called to find the base cost
      recalculateBaseCost: function() {
        if (this.isArray) {
          if ("baseCost" in this.power) {
            this.$delete(this.power, "baseCost");
          }
        } else if (this.hasOptions) {
          if (this.power.baseCost !== this.theOption.baseCost) {
            this.power.baseCost = this.theOption.baseCost;
          }
        } else {
          if (this.power.baseCost !== this.standardPower.baseCost) {
            this.power.baseCost = this.standardPower.baseCost;
          }
        }
      },
      recalculateCost: function() {
        const costCalcs = powerCostCalculate(this.power);
        this.extrasMultiplier = costCalcs.extrasMultiplier;
        this.flawsMultiplier = costCalcs.flawsMultiplier;
        this.flatAdder = costCalcs.flatAdder;
        if (this.power.cost !== costCalcs.cost) {
          this.power.cost = costCalcs.cost;
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

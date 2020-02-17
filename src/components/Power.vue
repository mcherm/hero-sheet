<template>
  <div class="power">
    <div class="flex-row">
      <div class="power-features">
        <label class="row-label">Name</label><StringEntry
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

        <label class="row-label">Extras</label><div></div>
        <label class="row-label">Flaws</label><div></div>
        <label class="row-label">Flats</label><div></div>
        <label class="row-label">Description</label><StringEntry v-model="power.description"/>
      </div>
      <div class="power-costs">
        <label class="row-label">Base Cost</label><div><NumberDisplay :value="power.baseCost"/></div>
        <label class="row-label">Extras</label><div><NumberDisplay :value="0"/></div>
        <label class="row-label">Flaws</label><div><NumberDisplay :value="0"/></div>
        <label v-if="!isArray" class="row-label">Ranks</label><div v-if="!isArray">
          <NumberEntry v-model="power.ranks"/>
        </div>
        <label class="row-label">Cost</label><div><NumberDisplay :value="power.cost"/></div>
      </div>
    </div>
    <div v-if="isArray" class="subpower-list">
      <div class="scrolling-list-header">Array Powers</div>
      <PowerList :powers="power.subpowers"/>
    </div>
  </div>
</template>

<script>
  export default {
    name: "Power",
    props: {
      power: { type: Object, required: true },
      standardPowers: { type: Object, required: true }
    },
    created: function() {
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
    },
    computed: {
      standardPower: function() {
        return this.standardPowers[this.power.effect] || null;
        // FIXME: If this works, use it below
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
        const standardPower = this.standardPowers[this.power.effect];
        if (typeof standardPower == "undefined") {
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
          if (this.isArray) {
            this.recalculateBaseCost();
          } else if (this.hasOptions) {
            this.recalculateBaseCost();
          } else {
            this.power.baseCost = standardPower.baseCost;
          }
        }
        this.recalculateCost();
      },
      // If it's an array, this will be called to find the base cost
      recalculateBaseCost: function() {
        if (this.isArray) {
          // FIXME: This is only calculating for the most common
          //   type of array; there are other options and I don't
          //   support even specifying them yet. For this one type
          //   the cost is:
          //     <largest-subpower-cost> + (<number-of-subpowers> - 1)
          const subpowers = this.power.subpowers;
          const numberOfSubpowers = subpowers.length;
          if (numberOfSubpowers === 0) {
            this.power.baseCost = 0;
          } else {
            const largestSubpowerCost = Math.max(...subpowers.map(x => x.cost));
            this.power.baseCost = largestSubpowerCost + (numberOfSubpowers - 1);
          }
        } else if (this.hasOptions) {
          this.power.baseCost = this.theOption.baseCost;
        }
      },
      recalculateCost: function() {
        const effectiveRanks = this.isArray ? 1 : this.power.ranks;
        this.power.cost = Math.ceil(this.power.baseCost * effectiveRanks);
      }
    }
  }
</script>

<style scoped>
  div.display-contents {
    display: contents;
  }
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

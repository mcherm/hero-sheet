<template>
  <boxed-section title="Powers">
    <template v-slot:exhibit>
      <local-cost-display extra-label="powers" :extra-value-function="powerCost"/>
    </template>
    <power-list :powers="getCharsheet().powers"/>
  </boxed-section>
</template>

<script>
  import LocalCostDisplay from "./LocalCostDisplay";
  import {newBlankPower} from "../js/heroSheetVersioning.js";
  import {powerCost} from "../js/heroSheetUtil";
  const standardPowers = require("../data/standardPowers.json");

  export default {
    name: "PowerListTopLevel",
    components: {
      LocalCostDisplay
    },
    inject: ["getCharsheet"],
    data: function() {
      return {
        deleteIsVisible: false
      }
    },
    computed: {
      /*
       * Returns just some of the standard powers, filtered by whatever
       * criteria we need at the moment while we develop them.
       */
      filteredStandardPowers: function() {
        const result = {};
        for (const key in standardPowers) {
          const power = standardPowers[key];
          if (power.powerLayout === 'array' || typeof(power.baseCost) === "number") {
            result[key] = power;
          }
        }
        return result;
      }
    },
    methods: {
      powerCost,
      addPower: function() {
        const blankPower = newBlankPower();
        this.powers.push(blankPower);
        const newPower = this.powers[this.powers.length - 1];
        this.renamePower(newPower, newPower.name);
      },
      /*
       * Called when a power gets a new name. It enforces a rule that
       * the name must be unique before applying the update, possibly
       * changing the name if needed to make it unique. Changing it
       * is done by appending ":2", EXCEPT that if it already ends in
       * ":" and a number, then it finds the lowest unused number
       * (eg: ":3") and uses that.
       */
      renamePower: function(power, newName) {
        const otherPowerNames = {};
        for (let p of this.powers) {
          if (p !== power) {
            otherPowerNames[p.name] = true
          }
        };
        const isDupName = otherPowerNames.hasOwnProperty(newName);
        if (!isDupName) {
          power.name = newName;
        } else {
          const regex = RegExp("^(.*):(\\d)+$");
          const match = newName.match(regex);
          let rootName = newName;
          let counter = 2;
          if (match) {
            rootName = match[1];
            counter = parseInt(match[2]) + 1;
          }
          let altName = rootName + ":" + counter.toString();
          while (otherPowerNames.hasOwnProperty(altName)) {
            counter += 1;
            altName = rootName + ":" + counter.toString();
          }
          power.name = altName;
        }
      }
    }
  }
</script>

<style scoped>
  div.power-list {
    border: 1px solid black;
    padding: 5px;
    margin: 5px;
  }
  ul.power-list {
    list-style-type: none;
    padding: 0;
    margin: 0;
  }
  .scrolling-list-header {
    text-align: center;
  }
  .scrolling-list-footer {
    text-align: center;
  }
  .power-list-cost {
    margin: 0px 4px;
    border: 1px solid black;
    padding: 2px 4px;
    border-radius: 5px;
  }
  div.power-list-row {
    display: flex;
  }
  div.power-list-row .power {
    flex: 1;
  }
  .trash-button {
    margin: 5px;
    flex: 0;
  }
</style>

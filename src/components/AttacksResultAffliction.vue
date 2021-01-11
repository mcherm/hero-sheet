<!--
  This component shows the outcome of an attack that does affliction in a little
  folding box.
-->
<template>
  <div>
    <div v-if="!widgetOpened" class="collapsed-header" @click="widgetOpened = true">Affliction [+]</div>
    <div v-else class="attacks-result-damage grid-with-lines">
      <div class="grid-header col-label" @click="widgetOpened = false">Affliction [-]</div>
      <div class="row-label">Success</div>
      <div class="row-data">no effect</div>
      <div v-if="hasLevel1" class="row-label">Failure</div>
      <div v-if="hasLevel1" class="row-data">{{level1Effect}}</div>
      <div v-if="hasLevel2" class="row-label">Failure by 6+</div>
      <div v-if="hasLevel2" class="row-data">{{level2Effect}}</div>
      <div v-if="hasLevel3" class="row-label">Failure by 11+</div>
      <div v-if="hasLevel3" class="row-data">{{level3Effect}}</div>
      <div class="footer">Recover with {{resistWithString}} vs DC {{10 + power.ranks}}</div>
    </div>
  </div>
</template>

<script>
  import {capitalize} from "@/js/heroSheetUtil.js";

  export default {
    name: "AttacksResultAffliction",
    props: {
      power: { type: Object, required: true }
    },
    data: function() {
      return {
        widgetOpened: false,
      }
    },
    computed: {
      level1Effect: function() {
        return this.effectString(1);
      },
      level2Effect: function() {
        return this.effectString(2);
      },
      level3Effect: function() {
        return this.effectString(3);
      },
      hasLevel1: function() {
        return true;
      },
      hasLevel2: function() {
        return this.power.extended.conditionsApplied[0].length >= 2;
      },
      hasLevel3: function() {
        return this.power.extended.conditionsApplied[0].length >= 3;
      },
      resistWithString: function() {
        const resistWith = this.power.extended.resistWith;
        if (resistWith === "") {
          return "Fortitude or Will";
        } else {
          return capitalize(resistWith);
        }
      }
    },
    methods: {
      effectString: function(level) {
        const applicableConditions = [];
        for (const conditionRow of this.power.extended.conditionsApplied) {
          const condition = conditionRow[level - 1];
          if (condition) {
            applicableConditions.push(capitalize(condition));
          }
        }
        if (applicableConditions.length === 0) {
          return `Target has a level ${level} affliction`;
        } else {
          return "Target is " + applicableConditions.join(" and ");
        }
      },
    }
  }
</script>

<style scoped>
.collapsed-header {
  padding: 2px 6px;
}
.attacks-result-damage {
  grid-template-columns: max-content max-content;
  margin: 3px;
  display: inline grid;
}
.attacks-result-damage .col-label {
  grid-column-end: span 2;
}
.attacks-result-damage .footer {
  grid-column-end: span 2;
  padding: 2px;
}
.row-label {
  text-transform: none;
  font-weight: normal;
}
.row-data {
  padding: 2px 4px;
}
</style>

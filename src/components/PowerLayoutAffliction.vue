<template>
  <div class="affliction-data">
    <div class="affliction-grid">
      <div v-for="conditionRow of power.extended.conditionsApplied" class="display-contents">
        <div v-for="level of range(1, conditionRow.length + 1)" :key="level" class="affliction-level">
          <label class="col-label">Level {{level}}</label>
          <select-entry
              v-model="conditionRow[level - 1]"
              :options="conditionsData.afflictionLevels[level - 1]"
              :mutable="mutable"
              :getDisplay="capitalize"
              unselectedItem="Choose..."
          />
        </div>
        <div v-for="level of range(conditionRow.length + 1, 4)" :key="level" class="empty-placeholder"/>
      </div>
    </div>
    <div class="affliction-extras">
      <div v-if="altResistance" class="extra-item">
        <label class="row-label">Resist with</label>
        <select-entry
            v-model="power.extended.alternateResistance"
            :options="['dodge', 'parry', 'toughness', 'fortitude', 'will']"
            :mutable="mutable"
            :getDisplay="capitalize"
            unselectedItem="Choose..."
        />
      </div>
      <div  class="extra-item">
        <label v-if="altResistance" class="row-label">Recover with</label>
        <label v-else class="row-label">Resist with</label>
        <select-entry
            v-model="power.extended.resistWith"
            :options="['fortitude', 'will']"
            :mutable="mutable"
            :getDisplay="capitalize"
            unselectedItem="Choose..."
        />
      </div>
    </div>
  </div>
</template>

<script>
  const conditionsData = require("@/data/conditionsData.json");

  import {capitalize} from "@/js/heroSheetUtil.js";

  /*
   * This is given an array and makes it be the specified length. If it is already right
   * nothing happens, if it is too long it will be truncated in place, and if it is too
   * short then makeValue is called repeatedly to create values to append.
   */
  const forceArrayLength = function(array, length, makeValue) {
    if (array.length > length) {
      array.splice(length, array.length - length);
    }
    while (array.length < length) {
      array.push(makeValue());
    }
  }

  export default {
    name: "PowerLayoutAffliction",
    props: {
      power: { type: Object, required: true },
      mutable: { type: Boolean, required: false, default: true }
    },
    data: function() {
      return {
        conditionsData,
      };
    },
    created: function() {
      const power = this.power;

      // -- Watch the highest degree and make the length of entries in extended.conditionsApplied match --
      const highestDegree = function() {
        if (power.effect !== "Affliction") {
          // We are about to make this a different power anyhow. Ignore it.
          return undefined;
        }
        const limitedDegree = x => x.modifierSource === "special" && x.modifierName === "Limited Degree";
        return (power.flaws.some(x => limitedDegree(x) && x.optionName === "Limited to one degree of effect")
          ? 1
          : (power.flaws.some(x => limitedDegree(x) && x.optionName === "Limited to two degrees of effect")
            ? 2
            : 3
          )
        );
      };
      const onHighestDegreeChange = function(highestDegree) {
        for (const conditionRow of power.extended.conditionsApplied) {
          forceArrayLength(conditionRow, highestDegree, () => "");
        }
      }
      this.$watch(
          highestDegree,
          onHighestDegreeChange,
          { deep: true, immediate: true }
      );

      // -- Watch the number of extra conditions and make the size of extended.conditionsApplied match --
      const numConditions = function() {
        if (power.effect !== "Affliction") {
          // We are about to make this a different power anyhow. Ignore it.
          return undefined;
        }
        return 1 + power.extras.filter(
            x => x.modifierSource === "special" && x.modifierName === "Extra Condition"
        ).length;
      };
      const onNumConditionsChange = function(numConditions) {
        forceArrayLength(power.extended.conditionsApplied, numConditions, () => new Array(highestDegree()).fill(""));
      };
      this.$watch(
        numConditions,
        onNumConditionsChange,
        { deep: true, immediate: true }
      );

      // -- Watch for the alternate resistance extra --
      const altResistance = function() {
        return power.extras.some(x => x.modifierSource === "special" && x.modifierName === "Alternate Resistance");
      };
      const onAltResistanceChange = function(altResistance) {
        if (!altResistance) {
          power.extended.alternateResistance = "";
        }
      }
      this.$watch(
        altResistance,
        onAltResistanceChange,
        { deep: true, immediate: true }
      );
    },
    computed: {
      altResistance: function() {
        return this.power.extras.some(x => x.modifierSource === "special" && x.modifierName === "Alternate Resistance");
      }
    },
    methods: {
      capitalize,
      /*
       * Return a series of numbers from [min .. (max-1)].
       */
      range: function(min, max) {
        return [...Array(max - min).keys()].map(x => x + min); // FIXME: Broken
      }
    }
  }
</script>

<style scoped>
  .affliction-data {
    margin: 2px 0;
  }
  .affliction-grid {
    display: grid;
    column-gap: 5px;
    row-gap: 5px;
    grid-template-columns: max-content max-content max-content;
  }
  .affliction-level {
    border: 1px solid var(--box-border-color);
  }
  .empty-placeholder {
  }
  .affliction-extras {
    display: flex;
  }
  .extra-item {
    display: flex;
    align-items: baseline;
    margin-top: 2px;
    margin-right: 5px;
  }
</style>
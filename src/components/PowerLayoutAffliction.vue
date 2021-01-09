<template>
  <div class="affliction-data">
    <div class="affliction-grid">
      <div v-for="conditionRow of range(0, extraConditions + 1)" class="display-contents">
        <div v-for="level of range(1, highestDegree + 1)" :key="level" class="affliction-level">
          <label class="col-label">Level {{level}}</label>
          <select-entry
              value=""
              :options="conditionsData.afflictionLevels[level - 1]"
              :mutable="mutable"
              :getDisplay="capitalize"
              unselectedItem="Choose..."
          />
        </div>
        <div v-for="level of range(highestDegree + 1, 4)" :key="level" class="empty-placeholder"/>
      </div>
    </div>
    <div class="affliction-extras">
      <div v-if="altResistance" class="extra-item">
        <label class="row-label">Resist with</label>
        <select-entry
            value="dodge"
            :options="['dodge', 'fortitude', 'parry', 'toughness', 'will']"
            :mutable="mutable"
            :getDisplay="capitalize"
            unselectedItem="Choose..."
        />
      </div>
      <div  class="extra-item">
        <label v-if="altResistance" class="row-label">Recover with</label>
        <label v-else class="row-label">Resist with</label>
        <select-entry
            value=""
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
    computed: {
      extraConditions: function() {
        return this.power.extras.filter(
            x => x.modifierSource === "special" && x.modifierName === "Extra Condition"
        ).length;
      },
     highestDegree: function() {
        const flaws = this.power.flaws;
        const limitedDegree = x => x.modifierSource === "special" && x.modifierName === "Limited Degree";
        return (flaws.some(x => limitedDegree(x) && x.optionName === "Limited to one degree of effect")
          ? 1
          : (flaws.some(x => limitedDegree(x) && x.optionName === "Limited to two degrees of effect")
            ? 2
            : 3
          )
        );
      },
      altResistance: function() {
        return this.power.extras.some(x => x.modifierSource === "special" && x.modifierName === "Alternate Resistance");
      }
    },
    methods: {
      capitalize: function(s) {
        return s.charAt(0).toUpperCase() + s.slice(1);
      },
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
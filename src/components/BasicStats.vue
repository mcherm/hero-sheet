<template>
  <boxed-section title="Abilities">

    <div class="stat-grid grid-with-lines">
      <div></div>
      <div class="col-label">Entered</div>
      <div class="col-label">Cost</div>
      <div class="col-label">Ranks</div>
      <div class="col-label">Docs</div>
      <div class="display-contents"
           v-for="(statData, statName) in statsData"
           :key="statName"
      >
        <div class="row-label">{{statName}}</div>
        <div v-if="lacksStat(charsheet, statName)" class="inapplicable">N/A</div>
        <number-entry v-else v-model="statObj(statName).entered"/>
        <div v-if="lacksStat(charsheet, statName)" class="inapplicable">N/A</div>
        <number-display v-else :value="costOfAbility(charsheet, statName)"/>
        <div v-if="lacksStat(charsheet, statName)" class="inapplicable">N/A</div>
        <modifiable-number-display
          v-else
          :value="statObj(statName).ranks"
          :is-modified="isManuallyAdjusted(statName)"
          @add-manual-adjustment="createNewManualAdjustment(statName, $event)"
          @remove-manual-adjustment="removeManualAdjustment(statName, $event)"
        />
        <docs-lookup :docsURL="statData.docsURL"/>
      </div>
    </div>

    <stats-extras class="ten-px-top-margin"/>

  </boxed-section>
</template>

<script>
  import {newAdjustment} from "../js/heroSheetVersioning.js";
  import {isManuallyAdjusted, addActiveEffect, removeActiveEffects, lacksStat, costOfAbility} from "../js/heroSheetUtil.js";

  import StatsExtras from "./StatsExtras.vue"
  const statsData = require("../data/statsData.json");

  export default {
    name: "BasicStats",
    inject: ["getCharsheet"],
    components: {
      StatsExtras,
    },
    data: function() {
      return {
        statsData,
        lacksStat,
        costOfAbility,
        charsheet: this.getCharsheet(),
      }
    },
    methods: {
      statObj: function(statName) {
        return this.charsheet.abilities[statName];
      },
      isManuallyAdjusted: function(statName) {
        return isManuallyAdjusted(this.charsheet, `abilities.${statName}.ranks`);
      },
      // FIXME: Closely related to the same function in Defenses; figure out how to share code
      removeManualAdjustment: function(statName) {
        removeActiveEffects(this.charsheet, x => x.isManualAdjustment, `abilities.${statName}.ranks`);
      },
      // FIXME: Closely related to the same function in Defenses; figure out how to share code
      createNewManualAdjustment: function(statName, modalResult) {
        const value = modalResult.value;
        const description = modalResult.description || `Manual Adjustment made to ${statName} Ranks`;
        this.removeManualAdjustment(statName); // do this as a precaution to clean up if there are errors
        const newActiveEffect = newAdjustment(
          description,
          value,
          { isManualAdjustment: true }
        );
        addActiveEffect(this.charsheet, `abilities.${statName}.ranks`, newActiveEffect);
      },
      inapplicableDueToConstruct: function(statName) {
        return (
          this.charsheet.misc.isMindlessConstruct && ["stamina", "intellect", "presence"].includes(statName) ||
          this.charsheet.misc.isImmobileConstruct && ["stamina", "strength", "agility"].includes(statName)
        );
      },
    }
  }
</script>

<style scoped>
  .boxed-section .v-box {
    display: flex;
    flex-flow: column;
    background-color: var(--section-color);
  }
  .stat-grid {
    grid-template-columns: max-content max-content max-content max-content max-content;
  }
  .inapplicable {
    background-color: var(--inapplicable-color);
    padding: 2px 6px;
  }
  .ten-px-top-margin {
    margin-top: 10px;
  }
</style>

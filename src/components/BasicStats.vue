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
        <number-entry
          :value="statObj(statName).entered"
          @input="updateEntered(statName, $event)"
        />
        <number-display :value="statObj(statName).cost"/>
        <div v-if="inapplicableDueToConstruct(statName)" class="inapplicable">Construct</div>
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

    <div class="stats-extras grid-with-lines">
      <label class="row-label" for="is-mindless-construct">Mindless Construct</label>
      <div class="grid-with-lines-cell">
        <input type="checkbox" id="is-mindless-construct" v-model="charsheet.misc.isMindlessConstruct">
      </div>
      <label class="row-label" for="is-immobile-construct">Immobile Construct</label>
      <div class="grid-with-lines-cell">
        <input type="checkbox" id="is-immobile-construct" v-model="charsheet.misc.isImmobileConstruct">
      </div>
    </div>

  </boxed-section>
</template>

<script>
  import {newAdjustment} from "../js/heroSheetVersioning.js";
  import {isManuallyAdjusted, addActiveEffect, removeActiveEffects} from "../js/heroSheetUtil.js";

  const statsData = require("../data/statsData.json");

  export default {
    name: "BasicStats",
    inject: ["getCharsheet"],
    data: function() {
      return {
        statsData,
        charsheet: this.getCharsheet(),
      }
    },
    methods: {
      statObj: function(statName) {
        return this.charsheet.abilities[statName];
      },
      updateEntered: function(statName, newValue) {
        const statObj = this.statObj(statName);
        statObj.entered = Number(newValue);
        statObj.cost = statObj.entered * 2;
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
      }
    }
  }
</script>

<style scoped>
  th {
    border: 1px solid var(--grid-line-color);
    text-align: center;
  }
  .stat-grid {
    grid-template-columns: max-content max-content max-content max-content max-content;
  }
  .stats-extras {
    grid-template-columns: max-content max-content;
    margin-top: 10px;
    display: inline grid;
  }
  .inapplicable {
    background-color: var(--inapplicable-color);
    padding: 2px 6px;
  }
</style>

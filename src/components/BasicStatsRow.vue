<template>
  <tr>
    <th scope="row" class="row-label">{{statName}}</th>
    <td>
      <number-entry
        :value="statObj.entered"
        @input="updateEntered($event)"
      />
    </td>
    <td><number-display :value="statObj.cost"/></td>
    <td>
      <modifiable-number-display
        :value="statObj.ranks"
        :is-modified="isManuallyAdjusted()"
        @add-manual-adjustment="createNewManualAdjustment"
        @remove-manual-adjustment="removeManualAdjustment"
      />
    </td>
    <td><docs-lookup :docsURL="docsURL"/></td>
  </tr>
</template>

<script>
  import {newAdjustment} from "../js/heroSheetVersioning.js";
  import {isManuallyAdjusted, addActiveEffect, removeActiveEffects} from "../js/heroSheetUtil.js";

  export default {
    name: "BasicStatsRow",
    props: {
      charsheet: { type: Object, required: true },
      statName: { type: String, required: true },
      statObj: { type: Object, required: true },
      docsURL: { required: true, validator: (x => x === null || typeof x === 'string') }
    },
    created: function() {
      this.updateEntered(this.statObj.entered);
    },
    methods: {
      updateEntered: function(newValue) {
        this.statObj.entered = Number(newValue);
        this.statObj.cost = this.statObj.entered * 2;
      },
      isManuallyAdjusted: function() {
        return isManuallyAdjusted(this.charsheet, `abilities.${this.statName}.ranks`);
      },
      removeManualAdjustment: function() {
        removeActiveEffects(this.charsheet, x => x.isManualAdjustment, `abilities.${this.statName}.ranks`);
      },
      createNewManualAdjustment: function(modalResult) {
        const value = modalResult.value;
        const description = modalResult.description || `Manual Adjustment made to ${this.statName} Ranks`;
        this.removeManualAdjustment(); // do this as a precaution to clean up if there are errors
        const newActiveEffect = newAdjustment(
          description,
          value,
          {
            isManualAdjustment: true
          }
        );
        addActiveEffect(this.charsheet, `abilities.${this.statName}.ranks`, newActiveEffect);
      }
    }
  }
</script>

<style scoped>
  td {
    border: 1px solid var(--grid-line-color);
    text-align: right;
  }
  th {
    border: 1px solid var(--grid-line-color);
  }
</style>

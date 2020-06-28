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
    <td><modifiable-number-display :value="statObj.ranks" :is-modified="isManuallyAdjusted()" @toggle-modify="toggleManuallyAdjusted()"/></td>
    <td><docs-lookup :docsURL="docsURL"/></td>
  </tr>
</template>

<script>
  import {newAdjustment} from "../js/heroSheetVersioning.js";

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
        const activeEffectKey = `abilities.${this.statName}.ranks`;
        const activeEffects = this.charsheet.activeEffects[activeEffectKey];
        if (activeEffects) {
          for (const activeEffect of activeEffects) {
            if (activeEffect.isManualAdjustment) {
              return true;
            }
          }
        }
        return false;
      },
      toggleManuallyAdjusted: function() {
        if (this.isManuallyAdjusted()) {
          this.removeManualAdjustment();
        } else {
          this.createNewManualAdjustment();
        }
      },
      removeManualAdjustment: function() {
        const activeEffectKey = `abilities.${this.statName}.ranks`;
        const activeEffects = this.charsheet.activeEffects[activeEffectKey];
        if (activeEffects) {
          // Remove any active effects for which x.isManualAdjustment is true
          let i = activeEffects.length;
          while (i--) {
            if (activeEffects[i].isManualAdjustment) {
              activeEffects.splice(i,1);
            }
          }
        }
      },
      createNewManualAdjustment: function() {
        const value = 5; // FIXME: Need to be able to ENTER this
        const description = `Manual Adjustment made to ${this.statName} Ranks`; // FIXME: Need to be able to ENTER this
        console.log(`createNewManualAdjustment(${value}, ${description})`); // FIXME: Remove
        this.removeManualAdjustment(); // do this as a precaution to clean up if there are errors
        const newActiveEffect = newAdjustment(
          description,
          value,
          {
            isManualAdjustment: true
          }
        );
        const activeEffectKey = `abilities.${this.statName}.ranks`;
        if (!this.charsheet.activeEffects[activeEffectKey]) {
          this.charsheet.activeEffects[activeEffectKey] = [];
        }
        const activeEffects = this.charsheet.activeEffects[activeEffectKey];
        activeEffects.push(newActiveEffect);
        console.log(`   At the end, activeEffects = ${JSON.stringify(activeEffects)}`); // FIXME: Remove
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

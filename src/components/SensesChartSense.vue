<!--
  A single sense row within the senses chart.
-->
<template>
  <div class="sense">
    <span class="sense-name">{{sense.name}}</span>
    <div v-for="quality in sense.qualities" class="sense-quality-small" :class="{'editable-here': mutable && isQualityEditableHere(quality)}">
      <span>{{quality.name}}</span>
      <span v-if="isQualityEditableHere(quality)" class="cost">({{sensesData.senseQualities[quality.name].costForSense}})</span>
      <div
          v-if="isRemovingMods && isQualityEditableHere(quality)"
          v-on:click="deleteQuality(quality)"
          class="trash-can"
      >
        <trash-icon/>
      </div>
    </div>
    <div v-if="isAddingMods" class="quality-creator">
      <select-entry
          :value="''"
          :options="singleSenseOptions"
          unselectedItem="Select One"
          @input="addQuality($event)"
      />
      <edit-button :onClick="() => isAddingMods = false">Cancel</edit-button>
    </div>
    <edit-button
        v-if="mutable && !isAddingMods && !isRemovingMods"
        :onClick="() => isAddingMods = true"
        class="plus-minus-button"
    >+</edit-button>
    <edit-button
        v-if="someQualityIsEditableHere && !isAddingMods && !isRemovingMods"
        :onClick="() => isRemovingMods = true"
        class="plus-minus-button"
    >-</edit-button>
    <edit-button
        v-if="isRemovingMods"
        :onClick="() => isRemovingMods = false"
    >Done Deleting</edit-button>
  </div>
</template>

<script>
  const sensesData = require("@/data/sensesData.json");
  import {newHsid} from "../js/heroSheetVersioning.js";

  export default {
    name: "SensesChartSense",
    props: {
      sense: { type: Object, required: true },
      mutable: { type: Boolean, required: false, default: true }
    },
    data: function() {
      return {
        sensesData,
        isAddingMods: false,
        isRemovingMods: false,
      }
    },
    computed: {
      someQualityIsEditableHere: function() {
        return this.someQualityIsEditableHereFunc();
      },
      singleSenseOptions: function() {
        return Object.values(sensesData.senseQualities)
            .map(x =>
                (
                    x.costForSense !== null &&  // it can be applied to a sense
                    !this.hasQuality(x.name) && // it is not already applied
                    (x.prerequisite === undefined || this.hasQuality(x.prerequisite)) // prerequisites satisfied
                )
                    ? x.name
                    : null
            )
            .filter(x => x !== null)
      },
    },
    methods: {
      /*
       * Returns true if the sense has the quality with this name; false otherwise.
       */
      hasQuality: function(qualityName) {
        return this.sense.qualities.map(x => x.name).includes(qualityName);
      },
      /*
       * Return true if the quality is from the current power and thus can be edited within this senses chart.
       */
      isQualityEditableHere: function(quality) {
        return quality.sourceHsid !== undefined; // FIXME: Real test needed
      },
      /*
       * Removes the given quality.
       */
      deleteQuality: function(quality) {
        const positionToDelete = this.sense.qualities.indexOf(quality);
        if (positionToDelete !== -1) {
          this.$delete(this.sense.qualities, positionToDelete);
        }
        if (!this.someQualityIsEditableHereFunc()) {
          this.isRemovingMods = false;
        }
      },
      someQualityIsEditableHereFunc: function() {
        return this.sense.qualities.some(this.isQualityEditableHere);
      },
      addQuality: function(option) {
        // FIXME: This should really add to the POWER, not the stub data
        // FIXME: Can option ever be null or undefined or something like that?
        this.isAddingMods = false;
        const newQuality = {
          name: option,
          sourceHsid: newHsid(),
        }
        this.sense.qualities.push(newQuality);
      }
    }
  }
</script>

<style scoped>
  .sense {
    padding: 2px;
    display: flex;
    align-items: center;
  }

  .sense-name {
    margin: 2px 15px 2px 10px;
  }

  .sense-quality-small {
    border: 1px solid var(--box-border-color);
    padding: 2px;
    margin: 1px;
    display: flex;
    align-items: center;
  }

  .sense-quality-small.editable-here {
    background: var(--entry-field);
  }

  .quality-creator {
    border: 1px solid var(--box-border-color);
    padding: 2px;
    margin: 1px;
    display: flex;
    align-items: center;
  }

  .cost::before {
    content: '\2000';
  }

  .plus-minus-button {
    padding-left: 3px;
    padding-right: 3px;
  }
</style>
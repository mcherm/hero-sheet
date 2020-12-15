<!--
  An editable / viewable list of qualities applied to a sense or sense type
-->
<template>
  <div class="quality-list">
    <div v-for="quality in sense.qualities" class="sense-quality-small" :class="{'editable-here': mutable && isQualityCreatedHere(quality)}">
      <span>
        <span v-if="quality.ranks !== undefined && quality.ranks !== 1">{{quality.ranks}}x </span>
        {{quality.name}}
        <span v-if="isQualityCreatedHere(quality)">({{costOfQuality(quality)}})</span>
      </span>
      <div v-if="isRemovingQuality && isQualityCreatedHere(quality)" v-on:click="deleteQuality(quality)">
        <trash-icon/>
      </div>
    </div>
    <div v-if="isAddingQuality" class="quality-creator">
      <select-entry
          :value="newQualityName"
          :options="qualityOptions"
          unselectedItem="Select One"
          @input="newQualityName = $event"
      />
      <number-entry v-if="newQualityData && newQualityData.hasRanks" v-model="newQualityRanks"/>
      <div v-if="newQualityData" class="newCost">({{newQualityData.costForSense}})</div>
      <edit-button :onClick="() => addNewQuality()" :disabled="!newQualityIsComplete">Create</edit-button>
      <edit-button :onClick="() => isAddingQuality = false">Cancel</edit-button>
      <div v-if="newQualityData" class="miniDescription">{{newQualityData.miniDescription}}</div>
    </div>
    <edit-button
        v-if="mutable && !isAddingQuality && !isRemovingQuality"
        :onClick="beginCreatingNewQuality"
        class="plus-minus-button"
    >+</edit-button>
    <edit-button
        v-if="someQualityIsEditableHere && !isAddingQuality && !isRemovingQuality"
        :onClick="() => isRemovingQuality = true"
        class="plus-minus-button"
    >-</edit-button>
    <edit-button
        v-if="isRemovingQuality"
        :onClick="() => isRemovingQuality = false"
    >Done Deleting</edit-button>
  </div>
</template>

<script>
  const sensesData = require("@/data/sensesData.json");
  import {newHsid} from "@/js/heroSheetVersioning.js";

  export default {
    name: "SensesChartQualityList",
    props: {
      sense: { type: Object, required: true }, // FIXME: Is this needed?
      mutable: { type: Boolean, required: false, default: true },
      isSenseCreatedHere: { type: Boolean, required: true }, // FIXME: Is this needed?
    },
    data: function() {
      return {
        isAddingQuality: false,
        isRemovingQuality: false,
        newQualityName: "",
        newQualityRanks: 1,
      }
    },
    computed: {
      someQualityIsEditableHere: function() {
        return this.someQualityIsEditableHereFunc();
      },
      qualityOptions: function() {
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
      newQualityIsComplete: function() {
        return this.newQualityName !== ""; // FIXME: Need more smarts than this eventually
      },
      /*
       * Contains the sensesData reference data for the quality that is currently being created,
       * or undefined if no specific quality is yet selected.
       */
      newQualityData: function() {
        return sensesData.senseQualities[this.newQualityName];
      }
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
      isQualityCreatedHere: function(quality) {
        return quality.sourceHsid !== undefined; // FIXME: Real test needed
      },
      costOfQuality: function(quality) {
        return sensesData.senseQualities[quality.name].costForSense * (quality.ranks === undefined ? 1 : quality.ranks);
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
          this.isRemovingQuality = false;
        }
      },
      someQualityIsEditableHereFunc: function() {
        return this.sense.qualities.some(this.isQualityCreatedHere);
      },
      beginCreatingNewQuality: function() {
        this.newQualityName = '';
        this.newQualityRanks = 1;
        this.isAddingQuality = true;
      },
      addNewQuality: function() {
        // FIXME: This should really add to the POWER, not the stub data
        this.isAddingQuality = false;
        const newQuality = { // FIXME: Eventually goes in the charsheet library
          name: this.newQualityName,
          sourceHsid: newHsid(),
        }
        if (this.newQualityData.hasRanks) {
          newQuality.ranks = this.newQualityRanks;
        }
        this.sense.qualities.push(newQuality);
      },
    },
  }
</script>

<style scoped>
  .quality-list {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
  }

  .sense-quality-small {
    border: 1px solid var(--box-border-color);
    padding: 2px;
    margin: 1px;
    display: flex;
    align-items: center;
    background: var(--paper-color);
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

  .newCost {
    margin-left: 3px;
    margin-right: 3px;
  }

  .plus-minus-button {
    padding-left: 3px;
    padding-right: 3px;
  }
</style>
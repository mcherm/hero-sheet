<!--
  An editable / viewable list of qualities applied to a sense or sense type
-->
<template>
  <div class="quality-list">
    <div v-for="quality in qualities" class="sense-quality-small" :class="{'editable-here': mutable && isQualityCreatedHere(quality)}">
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
      <div v-if="newQualityData" class="newCost">({{newQualityData[costField]}})</div>
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
      qualities: { type: Array, required: true }, // The list of qualities being viewed
      addedQualities: { type: Array, required: true }, // The list of qualities in a power that is being edited
      powerHsid: { type: String, required: true }, // The HSID of the feature that generated these qualities
      senseTypeName: { type: String, required: true }, // The name of the sense type we are are editing in
      senseHsid: { type: String, required: false, default: null }, // This is null if we are editing a sense type directly, or else the hsid of the sense being edited
      mutable: { type: Boolean, required: false, default: true },
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
      costField: function() {
        return this.senseHsid === null ? "costForSenseType" : "costForSense";
      },
      someQualityIsEditableHere: function() {
        return this.someQualityIsEditableHereFunc();
      },
      qualityOptions: function() {
        return Object.values(sensesData.senseQualities)
            .map(x =>
                (
                    x[this.costField] !== null &&  // it can be applied to this
                    !this.hasQuality(x.name) && // it is not already applied
                    (x.prerequisite === undefined || this.hasQuality(x.prerequisite)) // prerequisites satisfied
                )
                    ? x.name
                    : null
            )
            .filter(x => x !== null);
      },
      newQualityIsComplete: function() {
        return this.newQualityName !== "";
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
        return this.qualities.map(x => x.name).includes(qualityName);
      },
      /*
       * Return true if the quality is from the current power and thus can be edited within this senses chart.
       */
      isQualityCreatedHere: function(quality) {
        if (quality.sourceFeatureHsid !== this.powerHsid ) {
          return false;
        }
        return this.addedQualities.some(x => x.hsid === quality.sourceHsid);
      },
      costOfQuality: function(quality) {
        const qualityCost = sensesData.senseQualities[quality.name][this.costField];
        return qualityCost * (quality.ranks === undefined ? 1 : quality.ranks);
      },
      /*
       * Removes the given quality.
       */
      deleteQuality: function(quality) {
        // -- Remove from power added qualities --
        const powerPositionToDelete = this.addedQualities.findIndex(x => x.hsid === quality.sourceHsid);
        if (powerPositionToDelete !== -1) {
          this.$delete(this.addedQualities, powerPositionToDelete);
        }
        // -- Exit removal mode if there is nothing else we can remove --
        if (!this.someQualityIsEditableHereFunc()) {
          this.isRemovingQuality = false;
        }
      },
      someQualityIsEditableHereFunc: function() {
        return this.qualities.some(this.isQualityCreatedHere);
      },
      beginCreatingNewQuality: function() {
        this.newQualityName = '';
        this.newQualityRanks = 1;
        this.isAddingQuality = true;
      },
      addNewQuality: function() {
        this.isAddingQuality = false;
        const newQuality = {
          "senseType": this.senseTypeName,
          "quality": this.newQualityName,
          "hsid": newHsid()
        }
        if (this.newQualityData.hasRanks) {
          newQuality.ranks = this.newQualityRanks;
        }
        if (this.senseHsid !== null) {
          newQuality.senseHsid = this.senseHsid;
        }
        this.addedQualities.push(newQuality);
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
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
      }
    },
    methods: {
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

  .cost::before {
    content: '\2000';
  }

  .plus-minus-button {
    padding-left: 3px;
    padding-right: 3px;
  }
</style>
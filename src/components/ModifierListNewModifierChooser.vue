<template>
  <div
      class="add-modifier-chooser"
      :class="{'ranks-col': isItemSelected && selectedItem.hasRanks}"
  >
    <div class="dropdowns">
      <select v-model="selectedModifierKey">
        <option disabled value="none">Select One</option>
        <optgroup v-if="specialExtras.length" :label="`Special ${capitalize(modifierType)}`">
          <option
              v-for="(modifier, index) in specialExtras"
              :key="`special_${index}`"
              :value="`special_${index}`"
          >{{modifier.name}}</option>
        </optgroup>
        <optgroup :label="`Standard ${capitalize(modifierType)}`">
          <option
              v-for="(modifier, index) in modifiers"
              :key="`standard_${index}`"
              :value="`standard_${index}`"
          >{{modifier.name}}</option>
        </optgroup>
      </select>
      <div
          v-if="selectedModifier && selectedModifier.modifierOptions"
          class="new-modifier-option-picker"
      >
        <select v-model="selectedOptionIndex">
          <option disabled value="-1">Select One</option>
          <option
              v-for="(option, index) in selectedModifier.modifierOptions"
              :key="index"
              :value="index"
          >{{option.name}}</option>
        </select>
      </div>
    </div>
    <div v-if="isItemSelected && selectedItem.hasRanks">
      <label>Ranks:</label>
      <number-entry v-model="ranks"/>
    </div>
    <div>{{modifierDisplaySign(selectedItem, ranks)}}</div>
    <div class="buttons">
      <edit-button :disabled="!isFullySelected" :onClick="emitSelection">Create</edit-button>
      <edit-button :onClick="cancelCreateModifier">Cancel</edit-button>
    </div>
    <div class="description">{{selectedDescription}}</div>
    <docs-lookup :docsURL="isItemSelected ? selectedItem.docsURL : null" />
  </div>
</template>

<script>
  import {modifierDisplaySign, buildNewModifier} from "@/js/heroSheetUtil.js";
  const modifiersData = require("@/data/modifiersData.json");

  export default {
    name: "ModifierListNewModifierChooser",
    props: {
      modifierType: { type: String, required: true },
      specialExtras: { type: Array, required: true },
      powerEffectName: { type: String, required: true }
    },
    data: function() {
      return {
        modifiers: modifiersData[this.modifierType],
        selectedModifierKey: "none",
        selectedOptionIndex: -1,
        ranks: 1
      }
    },
    computed: {
      selectedModifierSource: function() {
        const key = this.selectedModifierKey;
        if (key === "none") {
          return null;
        } else if (key.startsWith("special_")) {
          return "special";
        } else if (key.startsWith("standard_")) {
          return "standard";
        } else {
          throw new Error("Invalid value for selectedModifierKey");
        }
      },
      selectedModifier: function() {
        const key = this.selectedModifierKey;
        if (key === "none") {
          return null;
        } else if (key.startsWith("special_")) {
          const index = parseInt(key.slice(8));
          return this.specialExtras[index];
        } else if (key.startsWith("standard_")) {
          const index = parseInt(key.slice(9));
          return this.modifiers[index];
        } else {
          throw new Error("Invalid value for selectedModifierKey");
        }
      },
      selectedModifierHasOptions: function() {
        return Boolean(this.selectedModifier && this.selectedModifier.modifierOptions);
      },
      selectedOption: function() {
        if (this.selectedModifierHasOptions) {
          const index = this.selectedOptionIndex;
          if (index === -1) {
            return null;
          } else {
            return this.selectedModifier.modifierOptions[index];
          }
        } else {
          return null;
        }
      },
      isItemSelected: function() {
        return Boolean(this.selectedModifierHasOptions ? this.selectedOption : this.selectedModifier);
      },
      selectedItem: function() {
        if (this.isItemSelected) {
          if (this.selectedModifierHasOptions) {
            return this.selectedOption;
          } else {
            return this.selectedModifier;
          }
        } else {
          return null;
        }
      },
      isRankInvalid: function() {
        return (this.isItemSelected && this.selectedItem.hasRanks && (isNaN(this.ranks) || this.ranks <= 0));
      },
      isFullySelected: function() {
        return this.isItemSelected && !this.isRankInvalid;
      },
      selectedDescription: function() {
        if (this.selectedOption) {
          return this.selectedOption.description;
        } else if (this.selectedModifier) {
          return this.selectedModifier.description;
        } else {
          return "";
        }
      }
    },
    methods: {
      modifierDisplaySign,
      emitSelection: function() {
        let response = null;
        const selectedItem = this.selectedItem;
        if (selectedItem) {
          response = buildNewModifier({
            modifierSource: this.selectedModifierSource,
            modifierName: this.selectedModifier.name,
            optionName: this.selectedModifierHasOptions ? selectedItem.name : null,
            effect: this.selectedModifierSource === "special" ? this.powerEffectName : null,
            ranks: this.ranks
          });
        }
        this.$emit('choose-modifier', response);
      },
      cancelCreateModifier: function() {
        this.$emit('choose-modifier', null);
      },
      capitalize: function(s) {
        if (s.length === 0) {
          return s;
        } else {
          return s.charAt(0).toUpperCase() + s.slice(1);
        }
      }
    }
  }
</script>

<style scoped>
  .dropdowns {
    padding: 1px;
    background-color: var(--entry-field);
  }
  .add-modifier-chooser {
    border: 1px solid var(--grid-line-color);
    padding: 1px;
    display: grid;
    grid-template-columns: auto 1fr auto auto auto;
    grid-column-gap: 5px;
    align-items: center;
  }
  .add-modifier-chooser.ranks-col {
    grid-template-columns: auto auto 1fr auto auto auto;
  }
</style>
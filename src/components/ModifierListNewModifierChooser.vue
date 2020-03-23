<template>
  <div class="add-modifier-chooser">
    <select v-model="selectedModifierIndex">
      <option disabled value="-1">Select One</option>
      <option
          v-for="(modifier, index) in modifiers"
          :key="index"
          :value="index"
      >{{modifier.name}}</option>
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
    <div
        v-if="isItemSelected && selectedItem.hasRanks"
    >
      <label>Ranks:</label>
      <number-entry v-model="ranks"/>
    </div>
    <button :disabled="!isFullySelected" v-on:click="emitSelection()">Create</button>
    <button v-on:click="emitSelection()">Cancel</button>
  </div>
</template>

<script>
  const modifiersData = require("../data/modifiersData.json");

  export default {
    name: "ModifierListNewModifierChooser",
    props: {
      modifierType: { type: String, required: true },
    },
    data: function() {
      return {
        modifiers: modifiersData[this.modifierType],
        selectedModifierIndex: -1,
        selectedOptionIndex: -1,
        ranks: 1
      }
    },
    computed: {
      selectedModifier: function() {
        const index = this.selectedModifierIndex;
        if (index === -1) {
          return null;
        } else {
          return this.modifiers[index];
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
      }
    },
    methods: {
      emitSelection: function() {
        let response = null;
        const selectedItem = this.selectedItem;
        if (selectedItem) {
          response = {
            "modifierName": this.selectedModifier.name,
          };
          if (this.selectedModifierHasOptions) {
            response.optionName = selectedItem.name;
          }
          if (selectedItem.hasRanks) {
            response.ranks = this.ranks;
          }
          response.costType = selectedItem.costType;
          response.cost = selectedItem.cost;

          const name = selectedItem.name;
          const costShown = selectedItem.cost * (selectedItem.hasRanks ? this.ranks : 1);
          const sign = costShown > 0 ? "+" : "";
          response.displayText = `${name} (${sign}${costShown})`;
        }
        this.$emit('choose-modifier', response);
      }
    }
  }
</script>

<style scoped>
  .add-modifier-chooser {
    border: 1px solid var(--grid-line-color);
    display: flex;
  }
  .add-modifier-chooser > * {
    margin-left: 3px;
    margin-right: 3px;
  }
</style>
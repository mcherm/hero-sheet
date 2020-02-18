<template>
  <div class="add-modifier-chooser">
    <select v-model="selectedModifierIndex">
      <option disabled value="">Select One</option>
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
        <option disabled value="">Select One</option>
        <option
            v-for="(option, index) in selectedModifier.modifierOptions"
            :key="index"
            :value="index"
        >{{option.name}}</option>
      </select>
    </div>
    <button :disabled="!isFullySelected" v-on:click="emitSelection()">Create</button>
    <button v-on:click="emitSelection()">Cancel</button>
  </div>
</template>

<script>
  const modifiersData = require("../data/modifiersData.json");

  export default {
    name: "ModifierListNewModifierChooser",
    data: function() {
      return {
        modifiers: modifiersData.extras,
        selectedModifierIndex: null,
        selectedOptionIndex: null
      }
    },
    computed: {
      selectedModifier: function() {
        const index = this.selectedModifierIndex;
        if (index === null || index === "") {
          return null;
        } else {
          return this.modifiers[index];
        }
      },
      selectedOption: function() {
        const index = this.selectedOptionIndex;
        if (index === null || index === "") {
          return null;
        } else {
          return this.selectedModifier.modifierOptions[index];
        }
      },
      isFullySelected: function() {
        return this.selectedOption ||
          (this.selectedModifier && !this.selectedModifier.modifierOptions);
      }
    },
    methods: {
      emitSelection: function() {
        let response = null;
        if (this.isFullySelected) {
          response = {
            "modifierName": this.selectedModifier.name,
          };
          if (this.selectedOption === null) {
            response.costType = this.selectedModifier.costType;
            response.cost = this.selectedModifier.cost;
          } else {
            response.optionName = this.selectedOption.name;
            response.costType = this.selectedOption.costType;
            response.cost = this.selectedOption.cost;
          }
          response.displayText = "Some-Modifier";
        }
        this.$emit('choose-modifier', response);
      }
    }
  }
</script>

<style scoped>
  .add-modifier-chooser {
    display: flex;
  }
  .add-modifier-chooser > * {
    margin-left: 3px;
    margin-right: 3px;
  }
</style>
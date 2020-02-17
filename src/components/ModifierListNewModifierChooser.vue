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
    <button>Create</button>
    <button v-on:click="$emit('choose-modifier', null)">Cancel</button>
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
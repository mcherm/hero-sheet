<template>
  <div class="modifier-list">
    <div v-for="modifier in modifiers" class="modifier">{{modifier.displayText}}</div>
    <button
        v-if="!isAddingModifier"
        v-on:click="isAddingModifier = true"
    >{{addButtonName}}</button>
    <ModifierListNewModifierChooser
        v-if="isAddingModifier"
        v-on:choose-modifier="isAddingModifier = false"
    />
  </div>
</template>

<script>
  import ModifierListNewModifierChooser from "./ModifierListNewModifierChooser";
  const modifiersData = require("../data/modifiersData.json");

  export default {
    name: "ModifierList",
    components: {
      ModifierListNewModifierChooser
    },
    props: {
       modifierType: { type: String, required: true },
    },
    data: function() {
      return {
        modifiers: [
          {
            "displayText": "Accurate +1",
            "modifierName": "Accurate",
            "costType": "flatPerRankOfPower",
            "cost": 1
          },
          {
            "displayText": "Affects Objects +0",
            "modifierName": "Affects Objects",
            "optionName": "Affects Objects",
            "costType": "perRank",
            "cost": 1
          }
        ],
        isAddingModifier: false
      }
    },
    computed: {
      addButtonName: function() {
        if (this.modifierType === "extras") {
          return "Add Extra";
        } else if (this.modifierType === "flaws") {
          return "Add Flaw";
        } else {
          throw Error(`Invalid modifierType, ${this.modifierType}`);
        }
      }
    }
  }
</script>

<style scoped>
  .modifier-list {
    display: flex;
    flex-wrap: wrap;
  }
  .modifier-list > * {
    margin-left: 3px;
    margin-right: 3px;
  }
  .modifier {
    padding: 1px;
    border: 1px solid var(--box-border-color);
    margin: 1px;
  }
</style>

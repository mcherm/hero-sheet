<template>
  <div class="modifier-list">
    <div v-for="modifier in modifiers" class="modifier">
      {{modifier.displayText}}
      <div
          v-if="isDeleting"
          v-on:click="deleteModifier(modifier)"
          class="trash-can"
      >
        <trash-icon/>
      </div>
    </div>
    <edit-button
        v-if="mutable && !isAdding && !isDeleting && power.effect !== ''"
        :onClick="() => isAdding = true"
        class="plus-minus-button"
    >+</edit-button>
    <modifier-list-new-modifier-chooser
        v-if="isAdding"
        :modifier-type="modifierType"
        :special-extras="specialExtras || []"
        :power-effect-name="standardPower.name"
        v-on:choose-modifier="finishChoosingNewModifier($event)"
    />
    <edit-button
        v-if="mutable && modifiers.length > 0 && !isAdding && !isDeleting"
        :onClick="() => isDeleting = true"
        class="plus-minus-button"
    >-</edit-button>
    <edit-button
        v-if="isDeleting"
        :onClick="() => isDeleting = false"
    >Done Deleting</edit-button>
  </div>
</template>

<script>
  import {addPowerModifier, deletePowerModifier, getStandardPower} from "@/js/heroSheetUtil.js";
  import ModifierListNewModifierChooser from "@/components/ModifierListNewModifierChooser.vue";

  export default {
    name: "ModifierList",
    components: {
      ModifierListNewModifierChooser
    },
    props: {
      modifierType: { type: String, required: true },
      power: { type: Object,  required: true },
      inheritedModifierLists: { type: Array, required: true },
      mutable: { type: Boolean, required: false, default: true }
    },
    data: function() {
      return {
        isAdding: false,
        isDeleting: false
      }
    },
    computed: {
      modifiers: function() {
        return this.power[this.modifierType];
      },
      standardPower: function() {
        return getStandardPower(this.power);
      },
      addButtonName: function() {
        if (this.modifierType === "extras") {
          return "Add Extra";
        } else if (this.modifierType === "flaws") {
          return "Add Flaw";
        } else {
          throw Error(`Invalid modifierType, ${this.modifierType}`);
        }
      },
      specialExtras: function() {
        if (this.standardPower === null) {
          return [];
        } else {
          return this.standardPower[this.modifierType];
        }
      }
    },
    methods: {
      finishChoosingNewModifier: function(event) {
        if (event !== null) {
          addPowerModifier(this.power, this.inheritedModifierLists, this.modifierType, event);
        }
        this.isAdding = false;
      },
      deleteModifier: function(modifier) {
        deletePowerModifier(this.power, this.inheritedModifierLists, this.modifierType, modifier);
        if (this.modifiers.length === 0) {
          this.isDeleting = false;
        }
      }
    }
  }
</script>

<style scoped>
  .modifier-list {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
  }
  .modifier {
    padding: 1px;
    border: 1px solid var(--box-border-color);
    margin: 1px;
    display: flex;
    align-items: center;
  }
  .trash-can {
    margin-left: 2px;
  }
  .plus-minus-button {
    padding-left: 3px;
    padding-right: 3px;
  }
</style>

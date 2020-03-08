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
    <button
        v-if="!isAdding && !isDeleting"
        v-on:click="isAdding = true"
        class="plus-minus-button"
    >+</button>
    <modifier-list-new-modifier-chooser
        v-if="isAdding"
        :modifier-type="modifierType"
        v-on:choose-modifier="finishChoosingNewModifier($event)"
    />
    <button
        v-if="modifiers.length > 0 && !isAdding && !isDeleting"
        v-on:click="isDeleting = true"
        class="plus-minus-button"
    >-</button>
    <button
        v-if="isDeleting"
        v-on:click="isDeleting = false"
    >Done Deleting</button>
  </div>
</template>

<script>
  import ModifierListNewModifierChooser from "./ModifierListNewModifierChooser";

  export default {
    name: "ModifierList",
    components: {
      ModifierListNewModifierChooser
    },
    props: {
      modifierType: { type: String, required: true },
      modifiers: { type: Array, required: true }
    },
    data: function() {
      return {
        isAdding: false,
        isDeleting: false
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
    },
    methods: {
      finishChoosingNewModifier: function(event) {
        if (event !== null) {
          this.modifiers.push(event);
        }
        this.isAdding = false;
      },
      deleteModifier: function(modifier) {
        const index = this.modifiers.indexOf(modifier);
        if (index !== -1) {
          this.$delete(this.modifiers, index);
        }
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
    padding-left: 0;
    padding-right: 0;
  }
</style>

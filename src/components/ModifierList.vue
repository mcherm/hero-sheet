<template>
  <div class="modifier-list">
    <div v-for="modifier in modifiers" class="modifier">
      {{modifier.displayText}}
      <div
          v-if="isDeleting"
          v-on:click="deleteModifier(modifier)"
          class="trash-can"
      >
        <TrashIcon/>
      </div>
    </div>
    <button
        v-if="!isAdding && !isDeleting"
        v-on:click="isAdding = true"
    >+</button>
    <ModifierListNewModifierChooser
        v-if="isAdding"
        v-on:choose-modifier="finishChoosingNewModifier($event)"
    />
    <button
        v-if="modifiers.length > 0 && !isAdding && !isDeleting"
        v-on:click="isDeleting = true"
    >-</button>
    <button
        v-if="isDeleting"
        v-on:click="isDeleting = false"
    >Done Deleting</button>
  </div>
</template>

<script>
  import ModifierListNewModifierChooser from "./ModifierListNewModifierChooser";
  import TrashIcon from "./TrashIcon";

  export default {
    name: "ModifierList",
    components: {
      TrashIcon,
      ModifierListNewModifierChooser
    },
    props: {
       modifierType: { type: String, required: true },
    },
    data: function() {
      return {
        modifiers: [],
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
</style>

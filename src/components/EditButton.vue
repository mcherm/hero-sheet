<!--
  A button which is used to edit the charsheet. It applies our standard formatting for
  buttons and also it is disabled when the charsheet is in read-only mode.
-->
<template>
  <button v-on:click="doClick($event)" :disabled="isDisabled" :class="{'disabled': disabled}">
    <slot/>
  </button>
</template>

<script>
  export default {
    name: "EditButton",
    inject: {
      editModes: { default: {} }
    },
    props: {
      onClick: { type: Function, required: true }, // Called with $event when the button is clicked
      isNavigation: { type: Boolean, required: false, default: false }, // if true, the button navigates not edits
      disabled: { type: Boolean, required: false, default: false }, // used to grey-out the button
    },
    methods: {
      doClick: function(event) {
        this.onClick(event);
      }
    },
    computed: {
      isDisabled: function() {
        const globalReadOnly = this.editModes && (
            this.editModes.editMode === "READ_ONLY" ||
            this.editModes.editMode === "PLAYING"
        );
        return this.disabled || (globalReadOnly && !this.isNavigation);
      }
    },
  }
</script>

<style scoped>
  button {
    margin: 3px;
    background-color: var(--button-color);
    border-radius: 5px;
    border: solid var(--box-border-color) 1px;
  }
  button.disabled[disabled] { /* the caller disabled the button so it should be greyed-out */
    color: rgb(100, 100, 100);
    border-color: rgb(100, 100, 100);
  }
  button[disabled] { /* the button is not clickable for some reason */
    color: inherit;
    background-color: var(--disabled-button-color);
  }
  button:active {
    background-color: var(--active-button-color);
  }
  button.disabled:active {
    background-color: var(--disabled-button-color);
  }
</style>

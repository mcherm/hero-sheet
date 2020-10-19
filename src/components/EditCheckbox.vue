<!--
  For use in places where a column of values have boxes to check, this is a checkbox that
  will become read-only when on a charsheet that is read-only.
-->
<template>
  <input type="checkbox" v-on:change="$emit('input', !value)" :disabled="isDisabled" :checked="value">
</template>

<script>
  export default {
    name: "EditCheckbox",
    inject: {
      editModes: { default: {} }
    },
    props: {
      value: { type: Boolean, required: true },
    },
    computed: {
      isDisabled: function() {
        const globalReadOnly = this.editModes && (
            this.editModes.editMode === "READ_ONLY" ||
            this.editModes.editMode === "PLAYING"
        );
        return globalReadOnly;
      }
    },
  }
</script>

<style scoped>
  input {
    color: var(--active-text-color);
  }
</style>

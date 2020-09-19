<template>
  <div class="yn-toggle" :class="{'disabled': isDisabled, 'read-only': isReadOnly}" @click="toggle()">{{value ? "Yes" : "No"}}</div>
</template>

<script>
  export default {
    name: "YesNoToggle",
    inject: ["editModes"],
    props: {
      value: { type: Boolean, required: true },
      mutable: { type: Boolean, requred: false, default: true },
    },
    computed: {
      isDisabled: function() {
        return !this.mutable;
      },
      isReadOnly: function() {
        const globalReadOnly = this.editModes && ("isReadOnly" in this.editModes) && this.editModes.isReadOnly;
        return globalReadOnly;
      }
    },
    methods: {
      toggle: function() {
        if (!this.isDisabled && !this.isReadOnly) {
          this.$emit("input", !this.value);
        }
      }
    }
  }
</script>

<style scoped>
  .yn-toggle {
    background-color: var(--entry-field);
  }
  .yn-toggle.disabled {
    background-color: var(--paper-color);
    color: grey;
  }
  .yn-toggle.read-only {
    background-color: var(--paper-color);
  }
</style>

<template>
  <div class="yn-toggle" :class="{'disabled': isDisabled, 'read-only': isReadOnly, 'used-in-play': usedInPlay}" @click="toggle()">{{value ? "Yes" : "No"}}</div>
</template>

<script>
  export default {
    name: "YesNoToggle",
    inject: ["editModes"],
    props: {
      value: { type: Boolean, required: true },
      mutable: { type: Boolean, required: false, default: true },
      usedInPlay: { type: Boolean, required: false, default: false },
    },
    computed: {
      isDisabled: function() {
        return !this.mutable;
      },
      isReadOnly: function() {
        const globalReadOnly = this.editModes && (
            this.editModes.editMode === "READ_ONLY" ||
            this.editModes.editMode === "PLAYING" && !this.usedInPlay
        );
        return globalReadOnly || !this.mutable;
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
  .yn-toggle.used-in-play {
    background-color: var(--in-play-entry-field);
  }
  .yn-toggle.disabled {
    background-color: var(--paper-color);
    color: grey;
  }
  .yn-toggle.read-only {
    background-color: var(--paper-color);
  }
</style>

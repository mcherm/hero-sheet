<template>
  <div class="yn-toggle" :class="{'disabled': !isReallyMutable}" @click="toggle()">{{value ? "Yes" : "No"}}</div>
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
      isReallyMutable: function() {
        const globalReadOnly = this.editModes && ("isReadOnly" in this.editModes) && this.editModes.isReadOnly;
        return this.mutable && !globalReadOnly;
      }
    },
    methods: {
      toggle: function() {
        if (this.isReallyMutable) {
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
    background-color: inherit;
  }
</style>

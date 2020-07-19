<template>
  <div class="yn-toggle" :class="{'disabled': !mutable}" @click="toggle()">{{value ? "Yes" : "No"}}</div>
</template>

<script>
  export default {
    name: "YesNoToggle",
    props: {
      value: { type: Boolean, required: true },
      mutable: { type: Boolean, requred: false, default: true },
    },
    methods: {
      toggle: function() {
        if (this.mutable) {
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

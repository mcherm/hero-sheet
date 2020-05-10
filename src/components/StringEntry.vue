<!--
  Enter a single integer value.
-->
<template>
  <input
    v-bind:value="value"
    v-on:change="$emit('input', $event.target.value)"
    class="string-entry"
    :disabled="!mutable"
  />
</template>

<script>
  export default {
    name: "StringEntry",
    props: {
      value: { type: String, required: true },
      mutable: { type: Boolean, required: false, default: true }
    }
  }
</script>

<style scoped>
  .string-entry {
    background-color: var(--entry-field);
    font-size: inherit;
  }
  .string-entry:disabled {
    background-color: inherit;
  }
</style>

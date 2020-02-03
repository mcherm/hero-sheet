<!--
  Enter a single integer value.
-->
<template>
  <input
    v-bind:value="value"
    v-on:change="$emit('input', $event.target.value)"
    class="string-entry"
  />
</template>

<script>
  export default {
    name: "StringEntry",
    props: {
      value: { type: String, required: true }
    }
  }
</script>

<style scoped>
  .string-entry {
    background-color: var(--entry-field);
    font-size: inherit;
  }
</style>

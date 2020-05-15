<template>
  <textarea
      v-bind:value="value"
      v-on:change="$emit('input', $event.target.value)"
  ></textarea>
</template>

<script>
  export default {
    name: "MultilineStringEntry",
    props: {
      value: { type: String, required: true },
      mutable: { type: Boolean, required: false, default: true }
    }
  }
</script>

<style scoped>
  textarea {
    background-color: var(--entry-field);
  }
</style>

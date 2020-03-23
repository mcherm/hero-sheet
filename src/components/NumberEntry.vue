<!--
  Enter a single integer value.

  Because JSON serialization turns NaNs into nulls, I want to make this support
  inputs of null (and might as well throw in undefined also) and display them as
  if they were a NaN.
-->
<template>
  <input
    v-bind:value="value"
    v-on:input="onInput($event.target.value)"
    class="number-entry"
    :class="{ 'nan': isNaNValue, 'negative': isNegative }"
    type="number"
  />
</template>

<script>
  const INTEGER_REGEX = /^ *[-+]?[0-9]+ *$/;

  export default {
    name: "NumberEntry",
    props: {
      value: { required: true, validator: x => x === undefined || x === null || typeof x === "number" },
    },
    computed: {
      isNegative: function() {
        return this.value < 0;
      },
      isNaNValue: function() {
        return this.value === undefined || this.value === null || Number.isNaN(this.value);
      }
    },
    methods: {
      onInput: function(newValueStr) {
        if (!INTEGER_REGEX.test(newValueStr)) {
          this.$emit('input', NaN);
        } else {
          const newValue = parseInt(newValueStr, 10);
          this.$emit('input', newValue);
        }
      }
    }
  }
</script>

<style scoped>
  .number-entry {
    text-align: right;
    background-color: var(--entry-field);
    padding: 2px 6px;
    width: 3em; /* Works in table columns < 3m wide and in grid layouts */
    font-size: inherit;
  }
  .number-entry.negative {
    color: var(--error-color);
  }
  .number-entry.nan {
    background-color: var(--error-color);
  }
</style>

<!--
  Display a single numeric value.

  Because JSON serialization turns NaNs into nulls, I want to make this support
  inputs of null (and might as well throw in undefined also) and display them as
  if they were a NaN.
-->
<template>
  <div
    class="number-display"
    :class="{ 'nan': isNaNValue, 'negative': isNegative, 'isOutOfSpec': isOutOfSpec }"
  >
    {{isNaNValue ? 'Err' : value}}
  </div>
</template>

<script>
  export default {
    name: "NumberDisplay",
    props: {
      value: { required: true, validator: x => x === undefined || x === null || typeof x === "number" },
      isOutOfSpec: { type: Boolean, required: false, default: false },
      showErrForNegatives: { type: Boolean, required: false, default: true }
    },
    computed: {
      isNegative: function() {
        return this.showErrForNegatives && !this.isNaNValue && this.value < 0;
      },
      isNaNValue: function() {
        return this.value === undefined || this.value === null || Number.isNaN(this.value);
      }
    }
  }
</script>

<style scoped>
  .number-display {
    text-align: right;
    background-color: var(--paper-color);
    padding: 2px 6px;
    margin-left: auto;
    margin-right: 0;
  }
  .number-display.negative {
    color: var(--error-color);
  }
  .number-display.nan {
    background-color: var(--error-color);
  }
  .number-display.isOutOfSpec {
    outline: var(--error-color) solid 4px;
    outline-offset: -4px;
  }
</style>

<!--
  Display a single numeric value.
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
      value: { type: Number, required: true },
      isOutOfSpec: { type: Boolean, required: false, default: false }
    },
    computed: {
      isNegative: function() {
        return this.value < 0;
      },
      isNaNValue: function() {
        return Number.isNaN(this.value);
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

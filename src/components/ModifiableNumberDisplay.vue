<!--
  This is like a NumberDisplay, except that it allows for users to make
  edits to the value.
-->
<template>
  <div class="modifiable-number-display">
    <pencil-icon :is-modified="isModified" @icon-click="$emit('toggle-modify')"/>
    <number-display :value="value" :is-out-of-spec="isOutOfSpec" :show-err-for-negatives="showErrForNegatives"/>
  </div>
  
</template>

<script>
  export default {
    name: "ModifiableNumberDisplay",
    props: {
      value: { required: true, validator: x => x === undefined || x === null || typeof x === "number" },
      isOutOfSpec: { type: Boolean, required: false, default: false },
      showErrForNegatives: { type: Boolean, required: false, default: true },
      isModified: { type: Boolean, required: true }
    }
  }
</script>

<style scoped>
  .modifiable-number-display {
    display: flex;
  }
</style>
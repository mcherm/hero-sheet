<template>
  <select :value="value" @input="$emit('input', $event.target.value)" class="effect-select">
    <option disabled value="">Select One</option>
    <optgroup label="Power Effects">
      <option
          v-for="standardPower of powersFilteredFor(x => x.isPrimitiveEffect && !x.isArray)"
          :key="standardPower.name"
          :value="standardPower.name"
      >{{standardPower.name}}</option>
    </optgroup>
    <optgroup label="Sample Powers">
      <option
          v-for="standardPower in powersFilteredFor(x => !x.isPrimitiveEffect)"
          :key="standardPower.name"
          :value="standardPower.name"
      >{{standardPower.name}}</option>
    </optgroup>
    <optgroup label="Arrays">
      <option
          v-for="standardPower in powersFilteredFor(x => x.isArray)"
          :key="standardPower.name"
          :value="standardPower.name"
      >{{standardPower.name}}</option>
    </optgroup>
  </select>
</template>

<script>
  const standardPowers = require("../data/standardPowers.json");

  export default {
    name: "PowerEffectSelect",
    props: {
      value: { type: String, required: true },
    },
    methods: {
      powersFilteredFor: function(filter) {
        return Object.values(standardPowers).filter(filter);
      }
    }
  }
</script>

<style scoped>

</style>

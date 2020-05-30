<template>
  <select :value="`standard|${value}`" @input="$emit('input', $event.target.value)" class="effect-select" :disabled="!mutable">
    <option disabled value="standard:">Select One</option>
    <optgroup label="Power Effects">
      <option
          v-for="standardPower of powersFilteredFor(x => !x.isArray)"
          :key="standardPower.name"
          :value="`standard|${standardPower.name}`"
      >{{standardPower.name}}</option>
    </optgroup>
    <optgroup label="Arrays">
      <option
          v-for="standardPower in powersFilteredFor(x => x.isArray)"
          :key="standardPower.name"
          :value="`standard|${standardPower.name}`"
      >{{standardPower.name}}</option>
    </optgroup>
    <optgroup label="Sample Powers">
      <option
          v-for="(samplePower, samplePowerName) in samplePowers()"
          :key="samplePowerName"
          :value="`sample|${samplePowerName}`"
      >{{samplePowerName}}</option>
    </optgroup>
  </select>
</template>

<script>
  const standardPowers = require("../data/standardPowers.json");
  const samplePowers = require("../data/samplePowers.json");

  export default {
    name: "PowerEffectSelect",
    props: {
      value: { type: String, required: true },
      mutable: { type: Boolean, required: false, default: true }
    },
    methods: {
      powersFilteredFor: function(filter) {
        return Object.values(standardPowers).filter(filter);
      },
      samplePowers: function() {
        return samplePowers;
      }
    }
  }
</script>

<style scoped>

</style>

<template>
  <div class="select-background" :class="{'read-only': isReadOnly, 'used-in-play': usedInPlay}">
    <select :value="`standard|${value}`" @input="$emit('input', $event.target.value)" class="effect-select" :disabled="isReadOnly">
      <option disabled value="standard:">Select One</option>
      <optgroup label="Power Effects">
        <option
            v-for="standardPower of powersFilteredFor(x => x.powerLayout !== 'array')"
            :key="standardPower.name"
            :value="`standard|${standardPower.name}`"
        >{{standardPower.name}}</option>
      </optgroup>
      <optgroup label="Arrays">
        <option
            v-for="standardPower in powersFilteredFor(x => x.powerLayout === 'array')"
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
  </div>
</template>

<script>
  const standardPowers = require("../data/standardPowers.json");
  const samplePowers = require("../data/samplePowers.json");

  export default {
    name: "PowerEffectSelect",
    inject: ["editModes"],
    props: {
      value: { type: String, required: true },
      mutable: { type: Boolean, required: false, default: true },
      usedInPlay: { type: Boolean, required: false, default: false },
    },
    methods: {
      powersFilteredFor: function(filter) {
        return Object.values(standardPowers).filter(filter);
      },
      samplePowers: function() {
        return samplePowers;
      }
    },
    computed: {
      isReadOnly: function() {
        const globalReadOnly = this.editModes && (
            this.editModes.editMode === "READ_ONLY" ||
            this.editModes.editMode === "PLAYING" && !this.usedInPlay
        );
        return globalReadOnly || !this.mutable;
      }
    },
  }
</script>

<style scoped>
  .select-background {
    background-color: var(--entry-field);
    padding: 2px;
    display: inline-block;
  }
  .select-background.used-in-play {
    background-color: var(--in-play-entry-field);
  }
  .select-background.read-only {
    background-color: var(--paper-color);
  }
  select[disabled] {
    color: inherit;
  }
</style>

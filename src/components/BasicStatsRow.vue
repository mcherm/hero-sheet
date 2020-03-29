<template>
  <tr>
    <th scope="row" class="row-label">{{statName}}</th>
    <td>
      <number-entry
        :value="statObj.entered"
        @input="updateEntered($event)"
      />
    </td>
    <td><number-display :value="statObj.cost"/></td>
    <td><number-display :value="statObj.ranks"/></td>
    <td><docs-lookup :docsURL="docsURL"/></td>
  </tr>
</template>

<script>
  export default {
    name: "BasicStatsRow",
    props: {
      statName: { type: String, required: true },
      statObj: { type: Object, required: true },
      docsURL: { required: true, validator: (x => x === null || typeof x === 'string') },
      activeEffects: { type: Object, required: true }
    },
    created: function() {
      this.updateEntered(this.statObj.entered);
      // FIXME: There HAS to be a better way to watch these. Maybe an updater? Something not tied to the display.
      const calcRanks = () => {
        const baseRanks = this.statObj.entered;
        const activeEffectKey = `abilities.${this.statName}.ranks`;
        const activeInitiativeEffects = this.activeEffects[activeEffectKey] || [];
        const ranks = activeInitiativeEffects.reduce((sum, activeEffect) => sum + activeEffect.value, baseRanks);
        console.log(`calculated ranks for ${this.statName}: ${ranks}`); // FIXME: Remove
        return ranks;
      };
      this.$watch(calcRanks, function() {
        this.statObj.ranks = calcRanks();
      }, {immediate: true});
    },
    methods: {
      updateEntered: function(newValue) {
        this.statObj.entered = Number(newValue);
        this.statObj.cost = this.statObj.entered * 2;
        this.statObj.ranks = this.statObj.entered;
      }
    }
  }
</script>

<style scoped>
  td {
    border: 1px solid var(--grid-line-color);
    text-align: right;
  }
  th {
    border: 1px solid var(--grid-line-color);
  }
</style>

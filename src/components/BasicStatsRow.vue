<template>
  <tr>
    <th scope="row" class="row-label">{{statName}}</th>
    <td>
      <NumberEntry
        :value="statObj.entered"
        @input="updateEntered($event)"
      />
    </td>
    <td><NumberDisplay :value="statObj.cost"/></td>
    <td><NumberDisplay :value="statObj.ranks"/></td>
    <td><DocsLookup :docsURL="docsURL"/></td>
  </tr>
</template>

<script>
  import DocsLookup from "./DocsLookup.vue"

  export default {
    name: "BasicStatsRow",
    components: {
      DocsLookup
    },
    props: {
      statName: { type: String, required: true },
      statObj: { type: Object, required: true },
      docsURL: { required: true, validator: (x => x === null || typeof x === 'string') }
    },
    created: function() {
      this.updateEntered(this.statObj.entered);
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

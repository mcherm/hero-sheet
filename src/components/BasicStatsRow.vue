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
    <td><modifiable-number-display :value="statObj.ranks" :is-modified="isModified" @toggle-modify="toggleModified()"/></td>
    <td><docs-lookup :docsURL="docsURL"/></td>
  </tr>
</template>

<script>
  export default {
    name: "BasicStatsRow",
    props: {
      statName: { type: String, required: true },
      statObj: { type: Object, required: true },
      docsURL: { required: true, validator: (x => x === null || typeof x === 'string') }
    },
    data: function() {
      return {
        isModified: false
      };
    },
    created: function() {
      this.updateEntered(this.statObj.entered);
    },
    methods: {
      updateEntered: function(newValue) {
        this.statObj.entered = Number(newValue);
        this.statObj.cost = this.statObj.entered * 2;
      },
      toggleModified: function() {
        this.isModified = !this.isModified;
        // FIXME: Need to do something real with the modification
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

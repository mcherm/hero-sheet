<template>
  <tr>
    <th scope="row" class="row-label">{{defenseName}}</th>
    <td><NumberDisplay :value="defenseObj.base"/></td>
    <td class="purchased" :class="{inapplicable: isImmutable}">
      <NumberEntry
        v-if="!isImmutable"
        :value="defenseObj.purchased"
        v-on:input="updatePurchased($event)"
      />
    </td>
    <td v-bind:class="{inapplicable: isImmutable}">
      <NumberDisplay v-if="!isImmutable" :value="defenseObj.cost"/>
    </td>
    <td><NumberDisplay :value="defenseObj.ranks"/></td>
  </tr>
</template>

<script>
  export default {
    name: "DefensesRow",
    props: {
      defenseName: { type: String, required: true },
      defenseObj: { type: Object, required: true }
    },
    created: function() {
      const defenseObj = this.defenseObj;
      this.$watch("defenseObj.base", function() {
        this.recalculate();
      });
      this.recalculate();
    },
    computed: {
      isImmutable: function() {
        return this.defenseName == 'toughness';
      }
    },
    methods: {
      updatePurchased: function(newValue) {
        this.defenseObj.purchased = newValue;
        this.recalculate();
      },
      recalculate: function() {
        const dob = this.defenseObj;
        dob.cost = dob.purchased;
        dob.ranks = dob.base + dob.purchased;
      }
    }
  }
</script>

<style scoped>
  td {
    border: 1px solid var(--grid-line-color);
  }
  td.purchased {
    text-align: right;
  }
  th {
    border: 1px solid var(--grid-line-color);
  }
  td.inapplicable {
    background-color: var(--inapplicable-color);
  }
</style>

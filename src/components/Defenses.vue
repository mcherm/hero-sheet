<template>
  <BoxedSection :title="'Defenses and Initiative'">
    <table class="defenses-table">
      <tr class="column-headers">
        <th></th>
        <th class="col-label">Base</th>
        <th class="col-label">Added</th>
        <th class="col-label">Cost</th>
        <th class="col-label">Ranks</th>
      </tr>
      <tr
        v-for="defenseName in Object.keys(character.defenses)"
        :key="defenseName"
        is="DefensesRow"
        :defenseName="defenseName"
        :defenseObj="character.defenses[defenseName]"
      />
    </table>
    <table class="initiative-table">
      <th class="row-label" scope="row">Initiative</th>
      <td><NumberDisplay :value="character.initiative"/></td>
    </table>
  </BoxedSection>
</template>

<script>
  import DefensesRow from "./DefensesRow.vue"

  export default {
    name: "Defenses",
    props: {
      character: { type: Object, required: true }
    },
    components: {
      DefensesRow
    },
    created: function() {
      const character = this.character;
      const abilities = this.character.abilities;
      const defenses = this.character.defenses;

      this.$watch("character.abilities.agility.ranks", function() {
        defenses.dodge.base = abilities.agility.ranks;
      }, { immediate: true });
      this.$watch("character.abilities.stamina.ranks", function() {
        defenses.fortitude.base = abilities.stamina.ranks;
      }, { immediate: true });
      this.$watch("character.abilities.fighting.ranks", function() {
        defenses.parry.base = abilities.fighting.ranks;
      }, { immediate: true });
      this.$watch("character.abilities.stamina.ranks", function() {
        defenses.toughness.base = abilities.stamina.ranks;
      }, { immediate: true });
      this.$watch("character.abilities.awareness.ranks", function() {
        defenses.will.base = abilities.awareness.ranks;
      }, { immediate: true });
      this.$watch("character.abilities.agility.ranks", function() {
        character.initiative = abilities.agility.ranks;
      }, { immediate: true });
    }
  }
</script>

<style scoped>
  td {
    border: 1px solid var(--grid-line-color);
  }
  th {
    border: 1px solid var(--grid-line-color);
  }
  .initiative-table {
    margin-top: 5px;
  }
</style>

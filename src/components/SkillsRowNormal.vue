<template>
  <tr>
    <th scope="row" class="row-label">{{skillName}}</th>
    <td class="abilityName">{{skillData.ability}}</td>
    <td><NumberDisplay :value="skill.baseValue"/></td>
    <td>
      <NumberEntry
        :value="skill.ranks"
        @input="$emit('update:ranks', $event)"
      />
    </td>
    <td><NumberDisplay :value="skill.skillRoll"/></td>
    <td><DocsLookup :docsURL="skillData.docsURL"/></td>
  </tr>
</template>

<script>
  import DocsLookup from "./DocsLookup.vue"

  const skillsData = require("../data/skillsData.json");

  export default {
    name: "SkillsRowNormal",
    components: {
      DocsLookup
    },
    props: {
      skillName: { type: String, required: true },
      skill: { type: Object, required: true },
      abilities: { type: Object, required: true }
    },
    created: function() {
      const pathToAbilityRanks = `abilities.${this.skillData.ability}.ranks`;
      this.$watch(pathToAbilityRanks, function() {
        this.skill.baseValue = this.abilities[this.skillData.ability].ranks;
      }, { immediate: true });
      this.$watch("skill.ranks", function() {
        this.recalculateSkillRoll();
      }, { immediate: true });
      this.$watch("skill.baseValue", function() {
        this.recalculateSkillRoll();
      }, { immediate: true });
    },
    computed: {
      skillData: function() {
        return skillsData.normalSkills[this.skillName];
      }
    },
    methods: {
      recalculateSkillRoll: function() {
        this.skill.skillRoll = this.skill.baseValue + this.skill.ranks;
      }
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
  .abilityName {
    text-transform: capitalize;
    padding: 0px 2px;
  }
</style>

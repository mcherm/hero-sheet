<template>
  <tr>
    <th scope="row" class="row-label">{{skillName}}</th>
    <td class="abilityName">{{skillData.ability}}</td>
    <td><NumberDisplay :value="baseValue"/></td>
    <td>
      <NumberEntry
        :value="skill.ranks"
        @input="$emit('update:ranks', $event)"
      />
    </td>
    <td>
      <div class="roll-not-applicable" v-if="skillRoll === null">N/A</div>
      <NumberDisplay v-if="skillRoll !== null" :value="skillRoll"/>
    </td>
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
    computed: {
      skillData: function() {
        return skillsData.normalSkills[this.skillName];
      },
      baseValue: function() {
        return this.abilities[this.skillData.ability].ranks;
      },
      skillRoll: function() {
        if (this.skillData.useUntrained || this.skill.ranks > 0) {
          return this.baseValue + this.skill.ranks;
        } else {
          return null;
        }
      }
    },
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
    padding: 0 2px;
  }
  .roll-not-applicable {
    text-align: center;
  }
</style>

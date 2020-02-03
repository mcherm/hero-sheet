<template>
  <BoxedSection :title="'Skills'">
    <table class="skills-table">
      <tr class="column-headers">
        <th></th>
        <th class="col-label">Ability</th>
        <th class="col-label">Base Value</th>
        <th class="col-label">Ranks</th>
        <th class="col-label">Skill Roll</th>
        <th class="col-label">Docs</th>
      </tr>
      <tr
        v-for="skillName in Object.keys(skills.skillList)"
        :key="skillName"
        is="SkillsRowNormal"
        :skillName="skillName"
        :skill="skills.skillList[skillName]"
        :abilities="abilities"
        v-on:update:ranks="updateRank(skillName, $event)"
      />
    </table>
  </BoxedSection>
</template>

<script>
  import SkillsRowNormal from "./SkillsRowNormal.vue"

  export default {
    name: "Skills",
    props: {
      skills: { type: Object, required: true },
      abilities: { type: Object, required: true }
    },
    components: {
      SkillsRowNormal
    },
    created: function() {
      this.updateTotalRanksAndCost();
    },
    methods: {
      /*
       * Called when a skill gets a new number of ranks.
       */
      updateRank: function(skillName, newRanks) {
        this.skills.skillList[skillName].ranks = Number(newRanks);
        this.updateTotalRanksAndCost();
      },
      updateTotalRanksAndCost: function() {
        this.skills.totalRanks = Object.values(this.skills.skillList).reduce(
          (x, y) => x + y.ranks, 0);
        this.skills.cost = Math.ceil(this.skills.totalRanks / 2);
      }
    }
  }
</script>

<style scoped>
  th {
    border: 1px solid var(--grid-line-color);
  }
</style>

<template>
  <tr>
    <th scope="row" class="row-label">{{skill.name}}</th>
    <td class="abilityName">{{skillData.ability}}</td>
    <td><NumberDisplay :value="baseValue"/></td>
    <td>
      <NumberEntry
        :value="skill.ranks"
        @input="$emit('update:ranks', $event)"
      />
    </td>
    <td>
      <StringEntry v-if="skill.isTemplate" v-model="skill.specialization"/>
    </td>
    <td>
      <div class="roll-not-applicable" v-if="skillRoll === null">N/A</div>
      <NumberDisplay v-if="skillRoll !== null" :value="skillRoll" :isOutOfSpec="skillOutOfSpec(skillRoll)"/>
    </td>
    <td><DocsLookup :docsURL="skillData.docsURL"/></td>
    <td v-if="isDeleting">
      <div v-if="skill.isTemplate" @click="$emit('delete')">
        <TrashIcon/>
      </div>
    </td>
  </tr>
</template>

<script>
  import DocsLookup from "./DocsLookup.vue"
  import TrashIcon from "./TrashIcon";

  const skillsData = require("../data/skillsData.json");

  export default {
    name: "SkillsRow",
    components: {
      DocsLookup,
      TrashIcon
    },
    props: {
      skill: { type: Object, required: true },
      isDeleting: { type: Boolean, required: true },
      character: { type: Object, required: true }
    },
    computed: {
      skillData: function() {
        let result;
        if (this.skill.isTemplate) {
          result = skillsData.templateSkills[this.skill.name];
        } else {
          result = skillsData.normalSkills[this.skill.name];
        }
        if (!result) {
          console.log(`skillData = ${JSON.stringify(result)} for skill ${JSON.stringify(this.skill)}`); // FIXME: Remove and inline
        }
        return result;
      },
      baseValue: function() {
        return this.character.abilities[this.skillData.ability].ranks;
      },
      skillRoll: function() {
        if (this.skillData.useUntrained || this.skill.ranks > 0) {
          return this.baseValue + this.skill.ranks;
        } else {
          return null;
        }
      }
    },
    methods: {
      skillOutOfSpec: function(skillRoll) {
        const powerLevel = this.character.campaign.powerLevel;
        return !isNaN(powerLevel) && !isNaN(skillRoll) && skillRoll > powerLevel + 10;
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
    padding: 0 2px;
  }
  .roll-not-applicable {
    text-align: center;
  }
</style>

<template>
  <div class="display-contents">
    <string-entry v-if="skill.isTemplate && skillData.customization === 'description'" v-model="skill.specialization" class="grid-with-lines-cell"/>
    <div v-else-if="skill.isTemplate && skillData.customization === 'selectAttack'" class="attack-picker grid-with-lines-cell">
      <select :value="skill.attackHsid" @change="setAttackHsid($event.target.value)">
        <option disabled value="">Select One</option>
        <option
            v-for="attack in charsheet.attacks.attackList"
            :key="attack.hsid"
            :value="attack.hsid"
        >{{attack.name}}</option>
      </select>
    </div>
    <div v-else class="inapplicable grid-with-lines-cell"></div>
  </div>
</template>

<script>
  const skillsData = require("../data/skillsData.json");

  export default {
    name: "SkillsCustomization",
    props: {
      skill: { type: Object, required: true },
      charsheet: { type: Object, required: true },
      skillData: { type: Object, required: true }
    },
    methods: {
      setAttackHsid: function(attackHsid) {
        this.skill.attackHsid = attackHsid;
        if (attackHsid) {
          this.$emit("newUpdater", {updater: "CombatSkillUpdater", skill: this.skill})
        }
      }
    }
  }
</script>

<style scoped>
  .inapplicable {
    background-color: var(--inapplicable-color);
  }
  .attack-picker {
    background-color: var(--entry-field);
  }
</style>
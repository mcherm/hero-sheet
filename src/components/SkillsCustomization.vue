<template>
  <div class="display-contents">
    <string-entry v-if="skill.isTemplate && skillData.customization === 'description'" v-model="skill.specialization" class="grid-with-lines-cell"/>
    <div v-else-if="skill.isTemplate && ['selectCloseAttack','selectRangedAttack'].includes(skillData.customization)" class="attack-picker grid-with-lines-cell">
      <select-entry
          :value="skill.attackHsid"
          @input="setAttackHsid($event)"
          unselectedItem="Select One"
          :options="getCharsheet().attacks.attackList.filter(
            x => x.range === (skillData.customization === 'selectCloseAttack' ? 'close' : 'ranged')
          )"
          :getValue="x => x.hsid"
          :getDisplay="x => x.name"
      />
    </div>
    <div v-else class="inapplicable grid-with-lines-cell"></div>
  </div>
</template>

<script>
  const skillsData = require("../data/skillsData.json");

  export default {
    name: "SkillsCustomization",
    inject: ["getCharsheet"],
    props: {
      skill: { type: Object, required: true },
      skillData: { type: Object, required: true }
    },
    methods: {
      setAttackHsid: function(attackHsid) {
        this.skill.attackHsid = attackHsid;
        if (attackHsid) {
          let updaterEvent = {
            charsheet: this.getCharsheet(),
            updater: "CombatSkillUpdater",
            skill: this.skill
          };
          this.$globals.eventBus.$emit("new-updater", updaterEvent);
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
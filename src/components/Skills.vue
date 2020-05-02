<template>
  <boxed-section title="Skills">
    <template v-slot:exhibit>
      <local-cost-display :charsheet="charsheet" extra-label="skills" :extra-value-function="skillCost"/>
    </template>
    <div class="minimum-necessary-width">
      <div
          class="skills-list grid-with-lines"
          :class="{ 'deleteInvisible': !deleteIsVisible, 'deleteVisible': deleteIsVisible}"
      >

        <label class="col-label">Skill</label>
        <label class="col-label">Ability</label>
        <label class="col-label">Base Value</label>
        <label class="col-label">Ranks</label>
        <label class="col-label">Customization</label>
        <label class="col-label">Skill Roll</label>
        <label class="col-label">Docs</label>
        <div v-if="deleteIsVisible" class="grid-with-lines-no-lines"></div>

        <div class="display-contents"
             v-for="(skill, skillIndex) in charsheet.skills.skillList"
             :key="skillIndex"
        >
          <label class="row-label" :class="{isOutOfSpec: !skill.name}">
            <span v-if="skillData(skill).ability">{{skill.name}}</span>
            <select v-else :value="skill.name" @change="setSkillName(skill, $event.target.value)">
              <option disabled value="">Select Skill</option>
              <option
                  v-for="(templateSkill, templateSkillName) in skillsData.templateSkills"
                  :key="templateSkillName"
                  :value="templateSkillName"
              >{{templateSkillName}}</option>
            </select>
            <span v-else>CHOOSE</span>
          </label>
          <td class="abilityName" :class="{isOutOfSpec: !skillData(skill).ability}">{{skillData(skill).ability}}</td>
          <number-display class="base-value" :value="baseValue(skill)"/>
          <number-entry
              :value="skill.ranks"
              @input="updateRanks(skill, $event)"
          />
          <skills-customization :skill="skill" :skillData="skillData(skill)" :charsheet="charsheet" v-on:newUpdater="$emit('newUpdater', $event)"/>
          <div v-if="skillRoll(skill) === null" class="skill-roll roll-not-applicable">N/A</div>
          <number-display v-else :value="skillRoll(skill)" :isOutOfSpec="skillOutOfSpec(skillRoll)" class="skill-roll"/>
          <docs-lookup :docsURL="skillData(skill).docsURL"/>
          <div v-if="deleteIsVisible && !skill.isTemplate" class="grid-with-lines-no-lines"></div>
          <button
              v-if="deleteIsVisible && skill.isTemplate"
              class="trash-button grid-with-lines-no-lines"
              @click="deleteSkill(skill)"
          >
            <trash-icon/>
          </button>
        </div>
      </div>
      <div class="scrolling-list-footer">
        <button v-on:click="addSkill()">Add Skill</button>
        <button v-on:click="deleteIsVisible = !deleteIsVisible">
          <span v-if="deleteIsVisible">Done Deleting</span>
          <span v-else>Delete</span>
        </button>
      </div>
    </div>
  </boxed-section>
</template>

<script>
  import LocalCostDisplay from "./LocalCostDisplay.vue";
  import SkillsCustomization from "./SkillsCustomization";
  import {newBlankSkill} from "../js/heroSheetVersioning.js";
  import {skillCost} from "../js/heroSheetUtil.js";
  const skillsData = require("../data/skillsData.json");

  export default {
    name: "Skills",
    components: {
      LocalCostDisplay,
      SkillsCustomization
    },
    props: {
      charsheet: { type: Object, required: true }
    },
    data: function() {
      return {
        skillsData: skillsData,
        deleteIsVisible: false
      }
    },
    methods: {
      skillCost,
      skillData: function(skill) {
        let result;
        if (skill.isTemplate) {
          result = skillsData.templateSkills[skill.name];
        } else {
          result = skillsData.normalSkills[skill.name];
        }
        if (!result) {
          // Need to return dummy value
          return {
            ability: null,
            useUntrained: false,
            docsURL: null
          };
        }
        return result;
      },
      baseValue: function(skill) {
        const ability = this.skillData(skill).ability;
        if (ability === null) {
          // This is a dummy skill (invalid). We just need to return some dummy data
          return 0;
        } else {
          return this.charsheet.abilities[ability].ranks;
        }
      },
      /*
       * Called when a skill gets a new number of ranks.
       */
      updateRanks: function(skill, newRanks) {
        skill.ranks = Number(newRanks);
        this.updateTotalCost();
      },
      updateTotalCost: function() {
        const totalRanks = this.charsheet.skills.skillList.reduce((x, y) => x + y.ranks, 0);
        this.charsheet.skills.cost = Math.ceil(totalRanks / 2);
      },
      ranksFromActiveEffects: function(skill) {
        const activeEffectKey = skill.isTemplate
          ? `skills.skillList#${skill.hsid}` // the template skills aren't supported yet
          : `skills.skillList@${skill.name}`;
        const pertinentActiveEffects = this.charsheet.activeEffects[activeEffectKey] || [];
        return pertinentActiveEffects.reduce((sum, activeEffect) => sum + activeEffect.value, 0);
      },
      skillRoll: function(skill) {
        const ranksFromActiveEffects = this.ranksFromActiveEffects(skill);
        const pertinentActiveEffects = this.charsheet.activeEffects["jackOfAllTrades"] || [];
        const jackOfAllTradesSum = pertinentActiveEffects.reduce((sum, activeEffect) => sum + activeEffect.value, 0);
        const isJackOfAllTrades = jackOfAllTradesSum > 0;
        const rollAllowed = this.skillData(skill).useUntrained || isJackOfAllTrades || skill.ranks > 0 || ranksFromActiveEffects > 0
        if (rollAllowed) {
          return this.baseValue(skill) + skill.ranks + ranksFromActiveEffects;
        } else {
          return null;
        }
      },
      skillOutOfSpec: function(skillRoll) {
        const powerLevel = this.charsheet.campaign.powerLevel;
        return !isNaN(powerLevel) && !isNaN(skillRoll) && skillRoll > powerLevel + 10;
      },
      setSkillName: function(skill, skillName) {
        skill.name = skillName;
        // NOTE: there's probably a better place for this code to live, but for now it's here
        // We create the fields needed for a given customization. Note that we MUST create
        // them using $set or else they won't be reactive.
        const customization = this.skillData(skill).customization;
        if (customization === "description") {
          this.$set(skill, "specialization", "");
        } else if (customization === "selectAttack") {
          this.$set(skill, "attackHsid", "");
        }
        this.sortSkills();
      },
      sortSkills: function() {
        this.charsheet.skills.skillList.sort(
          (x,y) => (x.name < y.name) ? -1 : (x.name > y.name) ? 1: 0
        );
      },
      deleteSkill: function(skill) {
        const skillList = this.charsheet.skills.skillList;
        this.$delete(skillList, skillList.indexOf(skill));
      },
      addSkill: function() {
        const newSkill = newBlankSkill();
        this.charsheet.skills.skillList.push(newSkill);
      }
    }
  }
</script>

<style scoped>
  .minimum-necessary-width {
    display: inline-block;
    background-color: var(--section-color);
  }
  .minimum-necessary-width > * {
    background-color: var(--paper-color);
  }
  .skills-list.deleteVisible {
    grid-template-columns: max-content max-content max-content max-content max-content max-content max-content max-content;
  }
  .skills-list.deleteInvisible {
    grid-template-columns: max-content max-content max-content max-content max-content max-content max-content;
  }
  div.scrolling-list-footer {
    background-color: var(--section-color);
    margin-top: 5px;
    text-align: center;
  }
  .abilityName {
    text-transform: capitalize;
    padding: 0 2px;
  }
  .skills-list > .display-contents > .base-value {
    margin-left: 0;
  }
  .skills-list > .display-contents > .skill-roll {
    margin-left: 0;
  }
  .roll-not-applicable {
    text-align: center;
  }
  .isOutOfSpec {
    outline: var(--error-color) solid 4px;
    outline-offset: -4px;
  }
</style>
<template>
  <BoxedSection :title="'Skills'">
    <table class="skills-table">
      <tr class="column-headers">
        <th></th>
        <th class="col-label">Ability</th>
        <th class="col-label">Base Value</th>
        <th class="col-label">Ranks</th>
        <th class="col-label">Specialization</th>
        <th class="col-label">Skill Roll</th>
        <th class="col-label">Docs</th>
        <th v-if="isDeleting" class="col-label"></th>
      </tr>
      <tr
        v-for="(skill, skillIndex) in skills.skillList"
        :key="skillIndex"
        is="SkillsRow"
        :skill="skill"
        :abilities="abilities"
        :isDeleting="isDeleting"
        v-on:update:ranks="updateRank(skill, $event)"
        v-on:delete="deleteSkill(skill)"
      />
    </table>
    <button v-if="!(isAdding || isDeleting)" v-on:click="isAdding = true">Add Skill</button>
    <button v-if="!(isAdding || isDeleting)" v-on:click="isDeleting = true">Delete Skill</button>
    <button v-if="isDeleting" v-on:click="isDeleting = false">Done Deleting</button>
    <div v-if="isAdding" class="wrapper-to-leave-background-color-alone">
      <select v-model="selectedTemplateToAdd">
        <option disabled value="">Select Skill to Add</option>
        <option
            v-for="(templateSkill, templateSkillName) in skillsData.templateSkills"
            :key="templateSkillName"
            :value="templateSkillName"
        >{{templateSkillName}}</option>
      </select>
    </div>
    <button v-if="isAdding" :disabled="selectedTemplateToAdd === ''" v-on:click="addTemplateSkill()">Add Skill</button>
    <button v-if="isAdding" v-on:click="stopAdding()">Cancel</button>
  </BoxedSection>
</template>

<script>
  import SkillsRow from "./SkillsRow.vue"

  const skillsData = require("../data/skillsData.json");

  export default {
    name: "Skills",
    components: {
      SkillsRow
    },
    created: function() {
      this.updateTotalCost();
    },
    data: function() {
      return {
        skillsData: skillsData,
        isAdding: false,
        isDeleting: false,
        selectedTemplateToAdd: ""
      };
    },
    props: {
      skills: { type: Object, required: true },
      abilities: { type: Object, required: true }
    },
    methods: {
      /*
       * Called when a skill gets a new number of ranks.
       */
      updateRank: function(skill, newRanks) {
        skill.ranks = Number(newRanks);
        this.updateTotalCost();
      },
      updateTotalCost: function() {
        const totalRanks = this.skills.skillList.reduce((x, y) => x + y.ranks, 0);
        this.skills.cost = Math.ceil(totalRanks / 2);
      },
      /*
       * Call this whenever we exit from the adding mode
       */
      stopAdding: function() {
        this.isAdding = false;
        this.selectedTemplateToAdd = "";
      },
      addTemplateSkill: function() {
        if (this.selectedTemplateToAdd === "") {
          throw Error("Should not be able to happen.");
        }
        const newSkillObject = {
          "name": this.selectedTemplateToAdd,
          "ranks": 0,
          "isTemplate": true,
          "specialization": ""
        };
        this.skills.skillList.push(newSkillObject);
        this.skills.skillList.sort(
          (x,y) => (x.name < y.name) ? -1 : (x.name > y.name) ? 1: 0
        );
        this.stopAdding();
      },
      deleteSkill: function(skill) {
        this.$delete(this.skills.skillList, this.skills.skillList.indexOf(skill));
      }
    }
  }
</script>

<style scoped>
  th {
    border: 1px solid var(--grid-line-color);
  }
  .wrapper-to-leave-background-color-alone {
    display: inline-block;
  }
</style>

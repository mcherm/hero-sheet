<template>
  <div class="character-sheet v-box">
    <TabDisplay>
      <template slot="background">
        <div class="h-box">
          <Campaign :campaign="character.campaign"/>
          <Naming :naming="character.naming"/>
          <OverallCosts :character="character"/>
        </div>
      </template>
      <template slot="abilities">
        <div class="h-box">
          <BasicStats :abilities="character.abilities"/>
          <Defenses :character="character" />
          <OverallCosts :character="character"/>
        </div>
      </template>
      <template slot="skills">
        <Skills :skills="character.skills" :abilities="character.abilities"/>
      </template>
      <template slot="advantages">
        <Advantages :advantages="character.advantages"/>
      </template>
      <template slot="powers">
        <PowerListTopLevel :powers="character.powers"/>
      </template>
      <template slot="complications">
        <Complications :complications="character.complications"/>
      </template>
    </TabDisplay>
    <div id="data-dump">
      <textarea v-model="character_json" readonly></textarea>
      <textarea v-model="characterData_json" readonly></textarea>
    </div>
  </div>
</template>

<script>
  import TabDisplay from "./TabDisplay.vue";
  import Campaign from "./Campaign.vue"
  import Naming from "./Naming.vue"
  import BasicStats from "./BasicStats.vue"
  import Defenses from "./Defenses.vue"
  import Skills from "./Skills.vue"
  import Advantages from "./Advantages.vue"
  import OverallCosts from "./OverallCosts.vue"
  import PowerListTopLevel from "./PowerListTopLevel.vue"
  import Complications from "./Complications";

  const statsData = require("../data/statsData.json");
  const defenseNames = require("../data/defenseNames.json");
  const skillsData = require("../data/skillsData.json");

  export default {
    name: "CharacterSheet",
    components: {
      TabDisplay,
      Campaign,
      Naming,
      BasicStats,
      Defenses,
      Skills,
      Advantages,
      OverallCosts,
      PowerListTopLevel,
      Complications
    },
    data: function() {
      return {
        characterData: {
          abilities: {
            strength: 1,
            stamina: 3,
            agility: 2,
            dexterity: 1,
            fighting: 4,
            intellect: 2,
            awareness: 0,
            presence: 1
          }
        },
        character: null,
      }
    },
    created: function() {
      this.character = this.characterFromCharacterData(this.characterData);
    },
    methods: {
      characterFromCharacterData: function(d) {
        const campaign = {
          powerLevel: 8,
          xpAwarded: 0,
          setting: ""
        };
        const naming = {
          name: "Teen Inventor",
          player: "Michael Chermside",
          identityType: "secret",
          identity: "",
          gender: "",
          age: "",
          heightWeight: "",
          eyesHair: "",
          costume: "",
          groupAffiliation: "",
          baseOfOperations: ""
        };
        const stats = [
          "strength", "stamina", "agility", "dexterity",
          "fighting", "intellect", "awareness", "presence"
        ];
        const abilities = {};
        for (const statName in statsData) {
          abilities[statName] = {
            entered: d.abilities[statName],
            cost: null,
            ranks: null
          };
        };
        const defenses = {
        };
        for (const defenseName of defenseNames) {
          // These will be populated by defenses
          defenses[defenseName] = {
            base: null,
            purchased: 0,
            cost: null,
            ranks: null
          }
        };
        const skillList = {
        };
        for (const skillName in skillsData.normalSkills) {
          skillList[skillName] = {
            ranks: 0,
            skillRoll: null
          };
        }
        const skills = {
          skillList,
          totalRanks: null,
          cost: 0
        };
        const advantages = [
          {
              "name": "Accurate Attack",
              "effect": null,
              "isRanked": null,
              "ranks": null,
              "description": ""
          },
          {
              "name": "Luck",
              "effect": null,
              "isRanked": null,
              "ranks": 3,
              "description": ""
          },
          {
              "name": "Improvised Tools",
              "effect": null,
              "isRanked": null,
              "ranks": null,
              "description": "Trained with master mechanic."
          }
        ];
        const powers = [
          {
            name: "Iron Armor",
            effect: "Protection",
            effectDescription: null,
            description: "",
            extras: [],
            flaws: [],
            flats: [],
            baseCost: null,
            ranks: 10,
            cost: 16,
            subpowers: []
          },
          {
            name: "Fury Fists",
            effect: "Blast",
            effectDescription: null,
            description: "Punch real hard",
            extras: [],
            flaws: [],
            flats: [],
            baseCost: null,
            ranks: 3,
            cost: 6,
            subpowers: []
          }
        ];
        const complications = [
          {
            "complicationType": "motivation",
            "description": "Patriotism drives her -- her desire to serve her country."
          },
          {
            "complicationType": "addiction",
            "description": "She is addicted to the super-soldier drug."
          }
        ];
        return {
          campaign,
          naming,
          abilities,
          defenses,
          initiative: null,
          advantages,
          skills,
          powers,
          complications
        }
      }
    },
    computed: {
      character_json: function() {
        return JSON.stringify(this.character, null, 2);
      },
      characterData_json: function() {
        return JSON.stringify(this.characterData, null, 2);
      }
    }
  }
</script>

<style scoped>
  .h-box {
    display: flex;
    flex-flow: row wrap;
  }
  .v-box {
    display: flex;
    flex-flow: column;
  }
  #data-dump {
    margin-top: 10px;
  }
</style>

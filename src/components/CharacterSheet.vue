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
    <div class="persistence-controls">
      <button v-on:click="saveCharacter()">Save</button>
    </div>
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
    props: {
      user: { type: String, required: true },
      characterId: { type: String, required: true }
    },
    data: function() {
      return {
        character: null
      }
    },
    created: function() {
      this.character = this.newBlankCharacter();
      this.loadCharacter();
    },
    methods: {
      newBlankCharacter: function() {
        const campaign = {
          powerLevel: 10,
          xpAwarded: 0,
          setting: ""
        };
        const naming = {
          name: "",
          player: "",
          identityType: "none",
          identity: "",
          gender: "",
          age: "",
          heightWeight: "",
          eyesHair: "",
          costume: "",
          groupAffiliation: "",
          baseOfOperations: ""
        };
        const abilities = {};
        for (const statName in statsData) {
          abilities[statName] = {
            entered: 0,
            cost: null,
            ranks: null
          };
        }
        const defenses = {};
        const initiative = null;
        for (const defenseName of defenseNames) {
          // These will be populated by defenses
          defenses[defenseName] = {
            base: null,
            purchased: 0,
            cost: null,
            ranks: null
          }
        }
        const skillList = {};
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
        const advantages = [];
        const powers = [];
        const complications = [];
        return {
          campaign,
          naming,
          abilities,
          defenses,
          initiative,
          advantages,
          skills,
          powers,
          complications
        }
      },
      loadCharacter: function() {
        const url = `https://u3qr0bfjmc.execute-api.us-east-1.amazonaws.com/prod/hero-sheet/users/${this.user}/characters/${this.characterId}`;
        fetch(url)
          .then((response) => {
            return response.json()
          })
          .then((json) => {
            this.character = json;
          });
      },
      saveCharacter: async function() {
        const url = `https://u3qr0bfjmc.execute-api.us-east-1.amazonaws.com/prod/hero-sheet/users/${this.user}/characters/${this.characterId}`;
        const body = this.character_json;
        const response = await fetch(url, {
          method: "PUT",
          mode: "cors",
          body: body
        });
        console.log("Response", response);
        // FIXME: for a 200 response I should do nothing, but if I get an error response we should display it!
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
  .persistence-controls {
    margin-top: 10px;
  }
  #data-dump {
    margin-top: 10px;
  }
</style>

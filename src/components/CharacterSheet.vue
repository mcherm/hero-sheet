<template>
  <div class="character-sheet v-box">
    <div v-if="character === null" class="character-loading">
      Loading...
    </div>
    <TabDisplay v-if="character !== null">
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
          <Defenses :character="character"/>
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
        character: null,
        hasUnsavedChanges: false,
        initialLoadHasTriggeredEvent: false
      }
    },
    created: function() {
      this.loadCharacter();
      const theVueObject = this;
      window.onbeforeunload = function() {
        if (theVueObject.hasUnsavedChanges) {
          theVueObject.saveCharacter();
          return true; // Displays a dialog saying there are unsaved changes
        } else {
          return null; // No dialog; just move on
        }
      };
    },
    methods: {
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
        this.hasUnsavedChanges = false; // Assume the request will save the changes. If it fails, we'll handle that below.
        const response = await fetch(url, {
          method: "PUT",
          headers: { 'Content-Type': 'application/json' },
          mode: "cors",
          body: body
        });
        if (response.status !== 200) {
          // FIXME: Need to display the error to the user
          console.log("Failed to save character", response);
          this.hasUnsavedChanges = true;
        }
      }
    },
    computed: {
      character_json: function() {
        return JSON.stringify(this.character, null, 2);
      },
      characterName: function() {
        try {
          return this.character.naming.name;
        } catch(err) {
          return "";
        }
      }
    },
    watch: {
      characterName: function(newName, oldName) {
        this.$emit("change-character-name", newName);
      },
      character: {
        deep: true,
        handler: function(newCharacter) {
          if (!this.initialLoadHasTriggeredEvent) {
            this.initialLoadHasTriggeredEvent = true;
          } else {
            if (!this.hasUnsavedChanges) {
              this.hasUnsavedChanges = true;
              const SAVE_FREQUENCY_MILLIS = 30000; // How often to save (in milliseconds)
              setTimeout(() => {
                this.saveCharacter();
              }, SAVE_FREQUENCY_MILLIS);
            }
          }
        }
      }
    },
    beforeDestroy() {
      if (this.hasUnsavedChanges) {
        this.saveCharacter();
      }
    }
  }
</script>

<style scoped>
  .character-loading {
    background-color: var(--section-color);
    border: 2px solid var(--box-border-color);
    padding: 6px;
    display: table;
    font-size: larger;
  }
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

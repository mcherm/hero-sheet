<template>
  <div class="character-sheet v-box">
    <div v-if="character === null" class="character-loading">
      Loading...
    </div>
    <tab-display v-if="character !== null">
      <template slot="background">
        <div class="h-box">
          <campaign :campaign="character.campaign"/>
          <background :character="character"/>
          <overall-costs :character="character"/>
        </div>
      </template>
      <template slot="abilities">
        <div class="h-box">
          <basic-stats :abilities="character.abilities"/>
          <defenses :character="character"/>
          <overall-costs :character="character"/>
        </div>
      </template>
      <template slot="skills">
        <skills :character="character"/>
      </template>
      <template slot="advantages">
        <advantages :character="character"/>
      </template>
      <template slot="powers">
        <power-list-top-level
            :character="character"
            v-on:newUpdater="createUpdater($event)"
            v-on:deleteUpdater="deleteUpdater($event)"
        />
      </template>
      <template slot="complications">
        <complications :complications="character.complications"/>
      </template>
      <template slot="attacks">
        <attacks :character="character"/>
      </template>
    </tab-display>
    <div id="data-dump">
      <textarea v-model="character_json" readonly></textarea>
    </div>
  </div>
</template>

<script>
  import TabDisplay from "./TabDisplay.vue";
  import Campaign from "./Campaign.vue"
  import Background from "./Background.vue"
  import BasicStats from "./BasicStats.vue"
  import Defenses from "./Defenses.vue"
  import Skills from "./Skills.vue"
  import Advantages from "./Advantages.vue"
  import OverallCosts from "./OverallCosts.vue"
  import PowerListTopLevel from "./PowerListTopLevel.vue"
  import Complications from "./Complications.vue";
  import Attacks from "./Attacks.vue"

  import {currentVersion, upgradeVersion, recreateUnarmedAttack, findPowerByHisd, updaterClasses} from "../js/heroSheetVersioning";

  // Maintain the list OUTSIDE of the vue object to avoid cyclic object values
  const updaters = [];

  export default {
    name: "CharacterSheet",
    components: {
      TabDisplay,
      Campaign,
      Background,
      BasicStats,
      Defenses,
      Skills,
      Advantages,
      OverallCosts,
      PowerListTopLevel,
      Complications,
      Attacks
    },
    props: {
      user: { type: String, required: true },
      characterId: { type: String, required: true }
    },
    data: function() {
      return {
        character: null,
        hasUnsavedChanges: false,
        activeSaveTimeout: null,
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
            const initialVersion = json.version;
            upgradeVersion(json);
            this.character = json;
            if (json.version !== initialVersion) {
              console.log(`Version has been upgraded from ${initialVersion} to ${json.version}.`);
              this.hasUnsavedChanges = true;
              this.scheduleSave();
            }
            this.installUpdaters();
          });
      },
      saveCharacter: async function() {
        this.activeSaveTimeout = null; // It has triggered so it is no longer active
        const isExperimentalVersion = this.character.version > currentVersion;
        if (isExperimentalVersion) {
          console.log(`Not saving as ${this.character.version} is an experimental version of the charsheet.`);
        } else {
          const url = `https://u3qr0bfjmc.execute-api.us-east-1.amazonaws.com/prod/hero-sheet/users/${this.user}/characters/${this.characterId}`;
          const body = this.character_json;
          this.hasUnsavedChanges = false; // Assume the request will save the changes. If it fails, we'll handle that below.
          try {
            const response = await fetch(url, {
              method: "PUT",
              headers: { 'Content-Type': 'application/json' },
              mode: "cors",
              body: body
            });
            if (response.status !== 200) {
              // FIXME: Need to display the error to the user
              console.log("Failed to save character", response);
              throw Error(`Save failed with status ${response.status}.`);
            } else {
              console.log("Save was successful.");
            }
          } catch(err) {
            console.log(`Error attempting to save:`, err);
            if (!this.hasUnsavedChanges) {
              // We marked it as saved but it wasn't done; better schedule a re-try
              this.hasUnsavedChanges = true;
              this.scheduleSave();
            }
          }
        }
      },
      scheduleSave() {
        const SAVE_FREQUENCY_MILLIS = 30 * 1000; // How often to save (in milliseconds)
        if (this.activeSaveTimeout !== null) {
          throw Error("Attempt to schedule new timeout when an existing one is still running.");
        }
        this.activeSaveTimeout = setTimeout(() => {
          this.saveCharacter();
        }, SAVE_FREQUENCY_MILLIS);
      },
      installNormalWatches() {
        // FIXME: Replace this with an updater
        // FIXME: Not sure if this is a good design, but this installs watches on things that we
        //   always need to monitor for any character sheet. It feels like it should be defined
        //   someplace else so eventually I will move it.
        this.$watch("character.abilities.fighting.ranks", function(newValue) {
          recreateUnarmedAttack(this.character);
        });
        this.$watch("character.abilities.strength.ranks", function(newValue) {
          recreateUnarmedAttack(this.character);
        });
      },
      installUpdaters: function() {
        for (const attack of this.character.attacks.attackList) {
          if (attack.type !== "unarmed") {
            const updaterType = attack.type;
            const power = findPowerByHisd(this.character, attack.hsid);
            const updateEvent = { updater: updaterType, power: power };
            const updater = this.createUpdater(updateEvent);
            updaters.push(updater);
          }
        }
      },
      createUpdater: function(newUpdaterEvent) {
        console.log(`createUpdater( ${JSON.stringify(newUpdaterEvent)} ) at ${Date.now()}`); // FIXME: Remove
        const updaterName = newUpdaterEvent.updater;

        const character = this.character;
        const power = newUpdaterEvent.power;
        const updaterClass = updaterClasses[updaterName];
        const updaterInstance = new updaterClass(this, character, newUpdaterEvent);
        updaters.push(updaterInstance);
      },
      deleteUpdater: function(deleteUpdaterEvent) {
        console.log(`DELETE updater ${JSON.stringify(deleteUpdaterEvent)}.`); // FIXME: Remove
        for (const updater of updaters) {
          const rightUpdaterType = updater.constructor.name === deleteUpdaterEvent.updater;
          const rightHsid = updater.power.hsid === deleteUpdaterEvent.powerHsid;
          if (rightUpdaterType && rightHsid) {
            updater.destroy();
          }
        }
      }
    },
    computed: {
      character_json: function() {
        return JSON.stringify(this.character, null, 2) + "\n";
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
            this.installNormalWatches();
          } else {
            if (!this.hasUnsavedChanges) {
              // It's a new change; better work on saving it
              this.hasUnsavedChanges = true;
              this.scheduleSave();
            }
          }
        }
      }
    },
    beforeDestroy() {
      if (this.activeSaveTimeout !== null) {
        clearTimeout(this.activeSaveTimeout);
        this.activeSaveTimeout = null;
      }
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

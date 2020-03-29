<template>
  <div class="character-sheet v-box">
    <div v-if="charsheet === null" class="character-loading">
      Loading...
    </div>
    <tab-display v-if="charsheet !== null">
      <template slot="background">
        <div class="h-box">
          <campaign :campaign="charsheet.campaign"/>
          <background :charsheet="charsheet"/>
          <overall-costs :charsheet="charsheet"/>
        </div>
      </template>
      <template slot="abilities">
        <div class="h-box">
          <basic-stats :abilities="charsheet.abilities"/>
          <defenses :charsheet="charsheet"/>
          <overall-costs :charsheet="charsheet"/>
        </div>
      </template>
      <template slot="skills">
        <skills :charsheet="charsheet"/>
      </template>
      <template slot="advantages">
        <advantages
            :charsheet="charsheet"
            v-on:newUpdater="createAdvantageUpdater($event)"
            v-on:deleteUpdater="deleteAdvantageUpdater($event)"
        />
      </template>
      <template slot="powers">
        <power-list-top-level
            :charsheet="charsheet"
            v-on:newUpdater="createPowerUpdater($event)"
            v-on:deleteUpdater="deletePowerUpdater($event)"
        />
      </template>
      <template slot="complications">
        <complications :complications="charsheet.complications"/>
      </template>
      <template slot="attacks">
        <attacks :charsheet="charsheet"/>
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

  import {currentVersion, findAdvantageByHsid, findPowerByHisd, updaterClasses, upgradeVersion} from "../js/heroSheetVersioning";

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
        charsheet: null,
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
            this.charsheet = json;
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
        const isExperimentalVersion = this.charsheet.version > currentVersion;
        if (isExperimentalVersion) {
          console.log(`Not saving as ${this.charsheet.version} is an experimental version of the charsheet.`);
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
      installUpdaters: function() {
        for (const attack of this.charsheet.attacks.attackList) {
          // FIXME: With a better design maybe I wouldn't need a special case here
          const updaterType = attack.updater;
          if (updaterType === "UnarmedAttackUpdater") {
            const updater = new updaterClasses[updaterType](this, this.charsheet);
            console.log(`about to push ${updater.constructor.name}`); // FIXME: Remove
            updaters.push(updater);
          } else {
            const power = findPowerByHisd(this.charsheet, attack.powerHsid);
            const updateEvent = { updater: updaterType, power: power };
            const updater = this.createPowerUpdater(updateEvent);
            console.log(`about to push ${updater.constructor.name}`); // FIXME: Remove
            updaters.push(updater);
          }
        }
        for (const activeEffectKey in this.charsheet.activeEffects) {
          console.log(`installingUpdaters for ${activeEffectKey}`); // FIXME: Remove
          for (const activeEffect of this.charsheet.activeEffects[activeEffectKey]) {
            console.log(`... installingUpdater for ${JSON.stringify(activeEffect)}`);
            const updaterType = activeEffect.updater;
            // FIXME: With a better design maybe I wouldn't need a special case here
            if (updaterType === "ImprovedInitiativeUpdater") {
              const advantage = findAdvantageByHsid(this.charsheet, activeEffect.advantageHsid);
              const updateEvent = { updater: updaterType, advantage: advantage };
              console.log(`...about to install ${updaterType}. updateEvent = ${JSON.stringify(updateEvent)}`)
              const updater = new updaterClasses[updaterType](this, this.charsheet, updateEvent);
              console.log(`about to push ${updater.constructor.name}`); // FIXME: Remove
              updaters.push(updater);
            } else {
              throw new Error(`Unsupported updater type '${updaterType}'.`);
            }
          }
        }
      },
      // FIXME: Definitely create a common newUpdater()
      createAdvantageUpdater: function(newUpdaterEvent) {
        const updaterName = newUpdaterEvent.updater;
        const charsheet = this.charsheet;
        const updaterClass = updaterClasses[updaterName];
        const updaterInstance = new updaterClass(this, charsheet, newUpdaterEvent);
        console.log(`about to push ${updaterInstance.constructor.name}`); // FIXME: Remove
        updaters.push(updaterInstance);
      },
      createPowerUpdater: function(newUpdaterEvent) {
        const updaterName = newUpdaterEvent.updater;
        const charsheet = this.charsheet;
        const updaterClass = updaterClasses[updaterName];
        const updaterInstance = new updaterClass(this, charsheet, newUpdaterEvent);
        console.log(`about to push ${updaterInstance.constructor.name}`); // FIXME: Remove
        updaters.push(updaterInstance);
      },
      // FIXME: Try to avoid having separate deletePowerUpdater and deleteAdvantageUpdater
      deletePowerUpdater: function(deleteUpdaterEvent) {
        for (const updater of updaters) {
          const rightUpdaterType = updater.constructor.name === deleteUpdaterEvent.updater;
          const rightHsid = updater.power.hsid === deleteUpdaterEvent.powerHsid;
          if (rightUpdaterType && rightHsid) {
            updater.destroy();
          }
        }
      },
      deleteAdvantageUpdater: function(deleteUpdaterEvent) {
        console.log(`in deleteAdvantageUpdater and the list is ${updaters.length} long`); // FIXME: Remove
        for (const updater of updaters) {
          console.log(`.. ${updater.constructor.name}, deleteUpdaterEvent: ${JSON.stringify(deleteUpdaterEvent)}`, updater); // FIXME: Remove
          if (
            updater.constructor.name === deleteUpdaterEvent.updater &&
            updater.advantage.hsid === deleteUpdaterEvent.advantageHsid
          ) {
            console.log(`about to call destroy()`); // FIXME: Remove
            updater.destroy();
          }
        }
      }
    },
    computed: {
      character_json: function() {
        return JSON.stringify(this.charsheet, null, 2) + "\n";
      },
      characterName: function() {
        try {
          return this.charsheet.naming.name;
        } catch(err) {
          return "";
        }
      }
    },
    watch: {
      characterName: function(newName, oldName) {
        this.$emit("change-character-name", newName);
      },
      charsheet: {
        deep: true,
        handler: function(newCharsheet) {
          if (!this.initialLoadHasTriggeredEvent) {
            this.initialLoadHasTriggeredEvent = true;
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

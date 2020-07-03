<!--
  Top level wrapper for the charsheet, which manages loading, saving, the name, and
  also maybe catches and handles some events.
-->
<template>
  <div class="character-container v-box">
    <div v-if="charsheet === null" class="character-loading">
      Loading...
    </div>
    <character-sheet v-else :charsheet="charsheet"/>
    <div id="data-dump">
      <textarea v-model="character_json" readonly></textarea>
    </div>
  </div>
</template>

<script>
  import CharacterSheet from "./CharacterSheet.vue";

  const statsData = require("../data/statsData.json");

  import {currentVersion, findFeatureByHsid, upgradeVersion} from "../js/heroSheetVersioning.js";
  import {updaterClasses, newUpdaterFromActiveEffect, UnsupportedUpdaterInActiveEffectError} from "../js/updaters.js";
  import {getCharacter, saveCharacter, NotLoggedInError} from "../js/api.js";
  import {removeActiveEffects} from "../js/heroSheetUtil.js";

  export default {
    name: "CharacterContainer",
    components: {
      CharacterSheet,
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
        initialLoadHasTriggeredEvent: false,
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
    mounted: function() {
      this.$globals.eventBus.$on("new-updater", this.createUpdater);
    },
    methods: {
      loadCharacter: async function() {
        try {
          const json = await getCharacter(this.user, this.characterId);
          const initialVersion = json.version;
          upgradeVersion(json, this.$globals.developerMode);
          this.charsheet = json;
          if (json.version !== initialVersion) {
            console.log(`Version has been upgraded from ${initialVersion} to ${json.version}.`);
            this.hasUnsavedChanges = true;
            this.scheduleSave();
          }
          this.installUpdaters();
        } catch(err) {
          if (err instanceof NotLoggedInError) {
            this.$emit("not-logged-in");
          } else {
            throw err;
          }
        }
      },
      saveCharacter: async function() {
        this.activeSaveTimeout = null; // It has triggered so it is no longer active
        const isExperimentalVersion = this.charsheet.version > currentVersion;
        if (isExperimentalVersion) {
          console.log(`Not saving as ${this.charsheet.version} is an experimental version of the charsheet.`);
        } else {
          this.hasUnsavedChanges = false; // Assume the request will save the changes. If it fails, we'll handle that below.
          try {
            await saveCharacter(this.user, this.characterId, this.charsheet);
            console.log("Save was successful.");
          } catch(err) {
            if (err instanceof NotLoggedInError) {
              this.$emit("not-logged-in");
            } else {
              console.log(`Failed to save character: ${err}`);
              if (!this.hasUnsavedChanges) {
                // We marked it as saved but it wasn't done; better schedule a re-try
                this.hasUnsavedChanges = true;
                this.scheduleSave();
              }
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
        for (const stat in statsData) {
          new updaterClasses["StatRankUpdater"](this, this.charsheet, stat);
        }
        new updaterClasses["DefenseUpdater"](this, this.charsheet, "dodge");
        new updaterClasses["DefenseUpdater"](this, this.charsheet, "fortitude");
        new updaterClasses["DefenseUpdater"](this, this.charsheet, "parry");
        new updaterClasses["ToughnessUpdater"](this, this.charsheet);
        new updaterClasses["DefenseUpdater"](this, this.charsheet, "will");
        const attackList = this.charsheet.attacks.attackList;
        for (const item of this.charsheet.equipment) {
          if (item.source === "custom" && item.feature) {
            const updaterType = "EquipmentFeatureUpdater";
            const updateEvent = { updater: updaterType, item: item }
            const updater = new updaterClasses[updaterType](this, this.charsheet, updateEvent);
          }
        }
        for (const attack of attackList) {
          // FIXME: With a better design maybe I wouldn't need a special case here
          const updaterType = attack.updater;
          if (updaterType === "UnarmedAttackUpdater") {
            const updater = new updaterClasses[updaterType](this, this.charsheet);
          } else {
            const feature = findFeatureByHsid(this.charsheet, attack.powerHsid);
            if (feature === null) {
              this.$delete(attackList, attackList.indexOf(attack));
              throw new Error(`Invalid power '${attack.powerHsid}' in attack. Will delete the attack.`)
            }
            const updateEvent = { updater: updaterType, power: feature };
            const updaterClass = updaterClasses[updaterType];
            if (updaterClass === undefined) {
              this.$delete(attackList, attackList.indexOf(attack));
              throw new Error(`Invalid updater type '${updaterType}' in attack. Will delete the attack.`)
            }
            new updaterClass(this, this.charsheet, updateEvent);
          }
        }
        // For any active effects with an updater, initialize that updater
        for (const activeEffectKey in this.charsheet.activeEffects) {
          for (const activeEffect of this.charsheet.activeEffects[activeEffectKey]) {
            const updaterType = activeEffect.updater;
            if (updaterType !== undefined) {
              try {
                newUpdaterFromActiveEffect(this, this.charsheet, activeEffect);
              } catch(err) {
                if (err instanceof UnsupportedUpdaterInActiveEffectError) {
                  removeActiveEffects(this.charsheet, x => x === activeEffect, activeEffectKey);
                  console.error(`Unsupported updater type '${updaterType}' in activeEffect. Will delete the activeEffect.`);
                } else {
                  throw err;
                }
              }
            }
          }
        }
        // FIXME: Here I need to recurse on any allies
      },
      createUpdater: function(newUpdaterEvent) {
        console.log(`createUpdater() was invoked in CharacterContainer.`); // FIXME: Remove
        const updaterName = newUpdaterEvent.updater;
        const updaterClass = updaterClasses[updaterName];
        if (updaterClass === undefined) {
          throw new Error(`Updater class '${updaterName}' not supported.`);
        }
        new updaterClass(this, this.charsheet, newUpdaterEvent);
      },
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
  #data-dump {
    margin-top: 10px;
  }
</style>

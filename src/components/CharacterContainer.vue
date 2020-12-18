<!--
  Top level wrapper for the charsheet, which manages loading, saving, the name, and
  also maybe catches and handles some events.
-->
<template>
  <div class="character-container v-box">
    <div v-if="charsheet === null" class="character-loading">
      Loading...
    </div>
    <character-sheet v-else :charsheet="charsheet" :edit-mode="editMode"/>
    <div v-if="this.$globals.developerMode" id="data-dump">
      <textarea v-model="character_json" readonly></textarea>
    </div>
  </div>
</template>

<script>
  import CharacterSheet from "./CharacterSheet.vue";

  const statsData = require("../data/statsData.json");

  import {currentVersion, findFeatureByHsid, upgradeVersion, findAllyByHsid, allyAdvantagesLowercase, renumberHsids} from "../js/heroSheetVersioning.js";
  import {updaterClasses, newUpdaterFromActiveEffect, UnsupportedUpdaterInActiveEffectError} from "../js/updaters.js";
  import {getCharacter, saveCharacter, createCharacter, NotLoggedInError} from "../js/api.js";
  import {removeActiveEffects, showAlert} from "../js/heroSheetUtil.js";

  // FIXME: Begin continuous validation
  const Ajv = require('ajv');
  const ajv = Ajv({allErrors: true});
  const commonSchema = require("../schema/common.schema.json");
  ajv.addSchema(commonSchema, "commonSchema");
  const charsheetSchema = require("../schema/charsheet.schema.json");
  ajv.addSchema(charsheetSchema, "charsheetSchema");
  // FIXME: End continuous validation

  export default {
    name: "CharacterContainer",
    components: {
      CharacterSheet,
    },
    props: {
      user: { type: String, required: true },
      characterId: { type: String, required: true },
      owningUser: { required: true, default: null },
      editMode: { type: String, required: true }
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
      this.$globals.eventBus.$on("new-ally", this.initializeAlly);
      this.$globals.eventBus.$on("duplicate-current-character", this.duplicateCurrentCharacter);
    },
    methods: {
      loadCharacter: async function() {
        try {
          const userOwningTheCharacter = this.owningUser === null ? this.user : this.owningUser;
          const json = await getCharacter(userOwningTheCharacter, this.characterId);
          const initialVersion = json.version;
          upgradeVersion(json, this.$globals.developerMode);
          this.charsheet = json;
          if (json.version !== initialVersion) {
            console.log(`Version has been upgraded from ${initialVersion} to ${json.version}.`);
            if (this.owningUser === null) {
              this.hasUnsavedChanges = true;
              this.scheduleSave();
            }
          }
          this.installUpdaters(this.charsheet);
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
        if (this.owningUser !== null) {
          showAlert({message: "Cannot save a character belonging to someone else.", lifetime: "short"});
          throw new Error("Attempted to save character that was owned by another user.");
        }
        const isExperimentalVersion = this.charsheet.version > currentVersion;
        if (isExperimentalVersion) {
          const message = `Not saving as ${this.charsheet.version} is an experimental version of the charsheet.`;
          showAlert({message, lifetime: "long"});
          console.log(message);
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
                // And let the user know
                showAlert({message: "Failed to save changes", lifetime: "short"});
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
      installUpdaters: function(charsheet) {
        for (const stat in statsData) {
          new updaterClasses["StatRankUpdater"](this, charsheet, stat);
        }
        new updaterClasses["DefenseUpdater"](this, charsheet, "dodge");
        new updaterClasses["DefenseUpdater"](this, charsheet, "fortitude");
        new updaterClasses["DefenseUpdater"](this, charsheet, "parry");
        new updaterClasses["ToughnessUpdater"](this, charsheet);
        new updaterClasses["DefenseUpdater"](this, charsheet, "will");
        new updaterClasses["ConstraintUpdater"](this, charsheet);
        for (const item of charsheet.equipment) {
          if (item.source === "custom" && item.feature) {
            const updaterType = "EquipmentFeatureUpdater";
            const updateEvent = { updater: updaterType, item: item }
            const updater = new updaterClasses[updaterType](this, charsheet, updateEvent);
          }
        }
        const attackList = [...charsheet.attacks.attackList]; // make a shallow copy since we may be deleting some items
        for (const attack of attackList) {
          // FIXME: With a better design maybe I wouldn't need a special case here
          const updaterType = attack.updater;
          let updater;
          if (updaterType === "UnarmedAttackUpdater") {
            updater = new updaterClasses[updaterType](this, charsheet);
          } else if (updaterType === "ThrownAttackUpdater") {
              updater = new updaterClasses[updaterType](this, charsheet);
          } else {
            const feature = findFeatureByHsid(charsheet, attack.powerHsid);
            if (feature === null) {
              this.$delete(charsheet.attacks.attackList, attackList.indexOf(attack));
              console.log(`Invalid power '${attack.powerHsid}' in attack. Will delete the attack.`)
            }
            const updateEvent = { updater: updaterType, power: feature };
            const updaterClass = updaterClasses[updaterType];
            if (updaterClass === undefined) {
              this.$delete(charsheet.attacks.attackList, attackList.indexOf(attack));
              console.log(`Invalid updater type '${updaterType}' in attack. Will delete the attack.`)
            }
            updater = new updaterClass(this, charsheet, updateEvent);
          }
          // Use the updater to reinitialize the attack to make sure it's accurate
          updater.reinitializeTheAttack();
        }
        // For any active effects with an updater, initialize that updater
        for (const activeEffectKey in charsheet.activeEffects) {
          for (const activeEffect of charsheet.activeEffects[activeEffectKey]) {
            const updaterType = activeEffect.updater;
            if (updaterType !== undefined) {
              try {
                newUpdaterFromActiveEffect(this, charsheet, activeEffect);
              } catch(err) {
                if (err instanceof UnsupportedUpdaterInActiveEffectError) {
                  removeActiveEffects(charsheet, x => x === activeEffect, activeEffectKey);
                  console.error(`Unsupported updater type '${updaterType}' in activeEffect. Will delete the activeEffect.`);
                } else {
                  throw err;
                }
              }
            }
          }
        }
        for (const ally of charsheet.allies) {
          this.initializeAlly({
            parentCharsheet: charsheet,
            allyHsid: ally.hsid
          });
        }
      },
      createUpdater: function(newUpdaterEvent) {
        const charsheet = newUpdaterEvent.charsheet;
        const updaterName = newUpdaterEvent.updater;
        const updaterClass = updaterClasses[updaterName];
        if (updaterClass === undefined) {
          throw new Error(`Updater class '${updaterName}' not supported.`);
        }
        new updaterClass(this, charsheet, newUpdaterEvent);
      },
      /*
       * Called after an ally is created. Should initialize the updaters for it -- both the
       * normal updaters of any charsheet and the specialized ones that help integrate in
       * this particular kind of ally.
       */
      initializeAlly: function(newAllyInfo) {
        const {parentCharsheet, allyHsid} = newAllyInfo;
        const ally = findAllyByHsid(parentCharsheet, allyHsid);
        // Normal Updaters
        if (ally !== undefined) {
          this.installUpdaters(ally.charsheet);
        }
        // ally-type specific things
        if (allyAdvantagesLowercase.includes(ally.type)) {
          const allyAdvantages = parentCharsheet.advantages.filter(x => x.allyHsid === allyHsid);
          if (allyAdvantages.length === 0) {
            const message = `Ally ${allyHsid} has no source. Probably need to handle that case. Maybe delete the ally?`;
            console.log(message);
            throw Error(message);
          } else if (allyAdvantages.length > 1) {
            const message = `Ally ${allyHsid} has MORE THAN 1 source. That's definitely a bug!`;
            console.log(message);
            throw Error(message);
          }
          const allyAdvantage = allyAdvantages[0];
          const newUpdaterEvent = {
            charsheet: parentCharsheet,
            updater: "AllyUpdater",
            allyHsid: ally.hsid,
            advantageHsid: allyAdvantage.hsid
          };
          this.createUpdater(newUpdaterEvent);
        } else {
          throw Error(`Ally type of ${ally.type} is not supported.`);
        }
      },
      /*
       * When called, make a duplicate of the current character, then close it and
       * emit a select-new-character event.
       */
      duplicateCurrentCharacter: async function() {
        const newCharsheet = renumberHsids(this.charsheet);
        let characterId;
        try {
          const createResponse = await createCharacter(this.user, newCharsheet);
          characterId = createResponse.characterId;
        } catch(err) {
          if (err instanceof NotLoggedInError) {
            this.$emit("not-logged-in");
          } else {
            showAlert({message: "Failed to duplicate character.", lifetime: "short"});
          }
          return;
        }
        // Succeeded in creating it; so we should go ahead and switch to it
        if (this.hasUnsavedChanges) {
          await this.saveCharacter();
        }
        showAlert({message: "Duplicate character created", lifetime: "manual", format: "info"});
        const changeCharacterData = {
          characterId: characterId,
          name: newCharsheet.naming.name,
          owningUser: null, // owned by the current user
        };
        this.$emit('change-character', changeCharacterData);
      }
    },
    computed: {
      character_json: function() {
        const result = JSON.stringify(this.charsheet, null, 2) + "\n";
        // FIXME: Begin continuous validation
        if (false && this.$globals.developerMode) { // FIXME: "false &&" has commented this out while I do development. DO NOT CHECK IN
          if (this.charsheet) {
            const reconstitutedCharsheet = JSON.parse(result); // Has NaN turned into null, and maybe other things
            const isValid = ajv.validate("charsheetSchema", reconstitutedCharsheet);
            if (!isValid) {
              console.log(`Failed Schema Validation: ${JSON.stringify(ajv.errors, null, 2)}`);
            }
          }
        }
        // FIXME: End continuous validation
        return result;
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

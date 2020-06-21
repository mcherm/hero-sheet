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
          <basic-stats :charsheet="charsheet"/>
          <defenses :charsheet="charsheet"/>
          <overall-costs :charsheet="charsheet"/>
        </div>
      </template>
      <template slot="skills">
        <skills :charsheet="charsheet" v-on:newUpdater="createUpdater($event)"/>
      </template>
      <template slot="advantages">
        <advantages :charsheet="charsheet" v-on:newUpdater="createUpdater($event)"/>
      </template>
      <template slot="equipment">
        <equipment :charsheet="charsheet" v-on:newUpdater="createUpdater($event)"/>
      </template>
      <template slot="powers">
        <power-list-top-level :charsheet="charsheet" v-on:newUpdater="createUpdater($event)"/>
      </template>
      <template slot="complications">
        <complications :charsheet="charsheet"/>
      </template>
      <template slot="attacks">
        <attacks :charsheet="charsheet"/>
      </template>
      <template slot="adjustments">
        <adjustments :charsheet="charsheet"/>
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
  import Equipment from "./Equipment.vue";
  import OverallCosts from "./OverallCosts.vue"
  import PowerListTopLevel from "./PowerListTopLevel.vue"
  import Complications from "./Complications.vue";
  import Attacks from "./Attacks.vue"
  import Adjustments from "./Adjustments.vue";

  const statsData = require("../data/statsData.json");

  import {currentVersion, findAdvantageByHsid, findFeatureByHsid, findSkillByHsid, upgradeVersion} from "../js/heroSheetVersioning.js";
  import {updaterClasses} from "../js/updaters.js";
  import {getCharacter, saveCharacter, NotLoggedInError} from "../js/api.js";

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
      Equipment,
      OverallCosts,
      PowerListTopLevel,
      Complications,
      Attacks,
      Adjustments
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
      loadCharacter: async function() {
        try {
          const json = await getCharacter(this.user, this.characterId);
          const initialVersion = json.version;
          upgradeVersion(json);
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
        for (const activeEffectKey in this.charsheet.activeEffects) {
          for (const activeEffect of this.charsheet.activeEffects[activeEffectKey]) {
            const updaterType = activeEffect.updater;
            // FIXME: With a better design maybe I wouldn't need a special case here
            if (["ImprovedInitiativeUpdater", "JackOfAllTradesUpdater"].includes(updaterType)) {
              const advantage = findAdvantageByHsid(this.charsheet, activeEffect.advantageHsid);
              if (advantage === null) {
                throw new Error("Updater references hsid that isn't found.");
              }
              const updateEvent = {updater: updaterType, advantage: advantage};
              new updaterClasses[updaterType](this, this.charsheet, updateEvent);
            } else if (["EnhancedTraitUpdater", "ProtectionUpdater"].includes(updaterType)) {
              const feature = findFeatureByHsid(this.charsheet, activeEffect.powerHsid);
              if (feature === null) {
                throw new Error("Updater references hsid that isn't found.");
              }
              const updateEvent = {updater: updaterType, power: feature};
              new updaterClasses[updaterType](this, this.charsheet, updateEvent);
            } else if (updaterType === "CombatSkillUpdater") {
              const skill = findSkillByHsid(this.charsheet, activeEffect.skillHsid);
              const updateEvent = {updater: updaterType, skill: skill};
              new updaterClasses[updaterType](this, this.charsheet, updateEvent);
            } else {
              const existingList = this.charsheet.activeEffects[activeEffectKey];
              this.$delete(existingList, existingList.indexOf(activeEffect));
              throw new Error(`Unsupported updater type '${updaterType}' in activeEffect. Will delete the activeEffect.`);
            }
          }
        }
      },
      createUpdater: function(newUpdaterEvent) {
        const updaterName = newUpdaterEvent.updater;
        const updaterClass = updaterClasses[updaterName];
        if (updaterClass === undefined) {
          throw new Error(`Updater class '${updaterName}' not supported.`);
        }
        new updaterClass(this, this.charsheet, newUpdaterEvent);
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

<template>
  <boxed-section title="Defenses and Initiative">

    <div class="defense-grid grid-with-lines">
      <label class="col-label"></label>
      <label class="col-label">Base</label>
      <label class="col-label">Added</label>
      <label class="col-label">Cost</label>
      <label class="col-label">Ranks</label>

      <div class="display-contents"
          v-for="defenseName in defenseNames"
          :key="defenseName"
      >
        <label class="row-label">{{defenseName}}</label>
        <div v-if="lacksDefense(defenseName)" class="inapplicable">N/A</div>
        <number-display v-else :value="base(defenseName)"/>
        <div v-if="isImmutable(defenseName)" class="inapplicable"/>
        <number-entry v-else v-model="obj(defenseName).purchased"/>
        <div v-if="isImmutable(defenseName)" class="inapplicable"/>
        <number-display v-else :value="obj(defenseName).cost"/>
        <div v-if="lacksDefense(defenseName)" class="inapplicable">N/A</div>
        <modifiable-number-display
          v-else
          :value="obj(defenseName).ranks"
          :isOutOfSpec="isOutOfSpec(defenseName)"
          :is-modified="isManuallyAdjusted(defenseName)"
          @add-manual-adjustment="createNewManualAdjustment(defenseName, $event)"
          @remove-manual-adjustment="removeManualAdjustment(defenseName)"
        />
      </div>
    </div>

    <div class="initiative-grid grid-with-lines">
      <label class="row-label">initiative</label>
      <div v-if="lacksInitiative()" class="inapplicable">N/A</div>
      <modifiable-number-display
        v-else
        :value="charsheet.misc.initiative"
        :is-modified="isInitiativeManuallyAdjusted()"
        @add-manual-adjustment="createNewInitiativeManualAdjustment($event)"
        @remove-manual-adjustment="removeInitiativeManualAdjustment()"
      />
    </div>

  </boxed-section>
</template>

<script>
  import {activeEffectModifier} from "@/js/heroSheetUtil.js";
  import {addActiveEffect, isManuallyAdjusted, removeActiveEffects, lacksStat} from "@/js/heroSheetUtil.js";
  import {newAdjustment} from "@/js/heroSheetVersioning.js";
  const defenseNames = require("@/data/defenseNames.json");

  const baseValueMap = {
    dodge: "agility",
    fortitude: "stamina",
    parry: "fighting",
    toughness: "stamina",
    will: "awareness"
  };

  export default {
    name: "Defenses",
    inject: ["getCharsheet"],
    data: function() {
      return {
        charsheet: this.getCharsheet(),
        defenseNames,
      };
    },
    created: function() {
      const calcInitiative = () => {
        if (lacksStat(this.charsheet, "agility")) {
          return this.charsheet.abilities.agility.ranks;
        } else {
          const agility = this.charsheet.abilities.agility.ranks;
          return agility + activeEffectModifier(this.charsheet, "initiative");
        }
      };
      this.$watch(calcInitiative, function() {
        this.charsheet.misc.initiative = calcInitiative();
      }, {immediate: true});
    },
    methods: {
      // Use within v-for to access the defense
      obj: function(defenseName) {
        return this.charsheet.defenses[defenseName];
      },
      isImmutable: function(defenseName) {
        return defenseName === 'toughness';
      },
      base: function(defenseName) {
        return this.charsheet.abilities[baseValueMap[defenseName]].ranks;
      },
      lacksDefense: function(defenseName) {
        return lacksStat(this.charsheet, baseValueMap[defenseName]);
      },
      lacksInitiative: function() {
        return lacksStat(this.charsheet, "agility");
      },
      isOutOfSpec: function(defenseName) {
        const activeViolation = key => {
          const violation = this.charsheet.constraintViolations[key];
          return violation !== undefined && !violation.gmApproval;
        };
        if (defenseName === "dodge") {
          return activeViolation("DodgeAndToughness");
        } else if (defenseName === "fortitude") {
          return activeViolation("FortitudeAndWill");
        } else if (defenseName === "parry") {
          return activeViolation("ParryAndToughness");
        } else if (defenseName === "toughness") {
          return activeViolation("DodgeAndToughness") || activeViolation("ParryAndToughness");
        } else if (defenseName === "will") {
          return activeViolation("FortitudeAndWill");
        }
      },
      isManuallyAdjusted: function(defenseName) {
        return isManuallyAdjusted(this.charsheet, `defenses.${defenseName}.ranks`);
      },
      // FIXME: Closely related to the same function in BasicStats; figure out how to share code
      removeManualAdjustment: function(defenseName) {
        removeActiveEffects(this.charsheet, x => x.isManualAdjustment, `defenses.${defenseName}.ranks`);
      },
      // FIXME: Closely related to the same function in BasicStats; figure out how to share code
      createNewManualAdjustment: function(defenseName, modalResult) {
        const value = modalResult.value;
        const description = modalResult.description || `Manual Adjustment made to ${defenseName} value`;
        this.removeManualAdjustment(defenseName); // do this as a precaution to clean up if there are errors
        const newActiveEffect = newAdjustment(
          description,
          value,
          { isManualAdjustment: true }
        );
        addActiveEffect(this.charsheet, `defenses.${defenseName}.ranks`, newActiveEffect);
      },
      isInitiativeManuallyAdjusted: function(defenseName) {
        return isManuallyAdjusted(this.charsheet, `initiative`);
      },
      // FIXME: Closely related to the same function in BasicStatsRow; figure out how to share code
      removeInitiativeManualAdjustment: function() {
        removeActiveEffects(this.charsheet, x => x.isManualAdjustment, `initiative`);
      },
      // FIXME: Closely related to the same function in BasicStatsRow; figure out how to share code
      createNewInitiativeManualAdjustment: function(modalResult) {
        const value = modalResult.value;
        const description = modalResult.description || `Manual Adjustment made to initiative value`;
        this.removeInitiativeManualAdjustment(); // do this as a precaution to clean up if there are errors
        const newActiveEffect = newAdjustment(
          description,
          value,
          {
            isManualAdjustment: true
          }
        );
        addActiveEffect(this.charsheet, `initiative`, newActiveEffect);
      },
    }
  }
</script>

<style scoped>
  .defense-grid {
    grid-template-columns: max-content max-content max-content max-content max-content;
  }
  .initiative-grid {
    grid-template-columns: max-content max-content;
    margin-top: 10px;
    display: inline grid;
  }
  .defense-grid > .display-contents > .number-display {
    margin-left: 0;
  }
  .inapplicable {
    background-color: var(--inapplicable-color);
    padding: 2px 6px;
  }
</style>
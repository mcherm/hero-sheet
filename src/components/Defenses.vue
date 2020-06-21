<template>
  <boxed-section title="Defenses and Initiative">

    <div class="defense-grid grid-with-lines">
      <label class="col-label"></label>
      <label class="col-label">Base</label>
      <label class="col-label">Added</label>
      <label class="col-label">Cost</label>
      <label class="col-label">Ranks</label>

      <div class="display-contents"
          v-for="defenseName in Object.keys(charsheet.defenses)"
          :key="defenseName"
      >
        <label class="row-label">{{defenseName}}</label>
        <number-display :value="base(defenseName)"/>
        <div v-if="isImmutable(defenseName)" class="inapplicable"/>
        <number-entry v-else v-model="obj(defenseName).purchased"/>
        <div v-if="isImmutable(defenseName)" class="inapplicable"/>
        <number-display v-else :value="obj(defenseName).cost"/>
        <number-display :value="obj(defenseName).ranks" :isOutOfSpec="isOutOfSpec(defenseName)"/>
      </div>
    </div>

    <div class="initiative-grid grid-with-lines">
      <label class="row-label">initiative</label>
      <number-display :value="charsheet.initiative"/>
    </div>

  </boxed-section>
</template>

<script>
  import {activeEffectModifier} from "../js/heroSheetUtil.js";

  const baseValueMap = {
    dodge: "agility",
    fortitude: "stamina",
    parry: "fighting",
    toughness: "stamina",
    will: "awareness"
  };

  export default {
    name: "Defenses",
    props: {
      charsheet: { type: Object, required: true }
    },
    created: function() {
      const calcInitiative = () => {
        const agility = this.charsheet.abilities.agility.ranks;
        return agility + activeEffectModifier(this.charsheet, "initiative");
      };
      this.$watch(calcInitiative, function() {
        this.charsheet.initiative = calcInitiative();
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
      isOutOfSpec: function(defenseName) {
        // -- values --
        const powerLevel = this.charsheet.campaign.powerLevel;
        const defenses = this.charsheet.defenses;
        const dodge = defenses.dodge.ranks;
        const fortitude = defenses.fortitude.ranks;
        const parry = defenses.parry.ranks;
        const toughness = defenses.toughness.ranks;
        const will = defenses.will.ranks;
        // -- rules --
        const exceeds = function(maxValue, value) {
          return !isNaN(maxValue) && !isNaN(value) && value > maxValue;
        };
        const fortWillExceeded = exceeds(powerLevel * 2, fortitude + will);
        const parryToughExceeded = exceeds(powerLevel * 2, parry + toughness);
        const dodgeToughExceeded = exceeds(powerLevel * 2, dodge + toughness);
        // -- results --
        if (defenseName === "dodge") {
          return dodgeToughExceeded;
        } else if (defenseName === "fortitude") {
          return fortWillExceeded;
        } else if (defenseName === "parry") {
          return parryToughExceeded;
        } else if (defenseName === "toughness") {
          return parryToughExceeded || dodgeToughExceeded;
        } else if (defenseName === "will") {
          return fortWillExceeded;
        } else {
          return false;
        }
      }
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
  }

</style>
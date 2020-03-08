<template>
  <boxed-section title="Defenses and Initiative">

    <div class="defense-grid grid-with-lines">
      <label class="col-label"></label>
      <label class="col-label">Base</label>
      <label class="col-label">Added</label>
      <label class="col-label">Cost</label>
      <label class="col-label">Ranks</label>

      <div class="display-contents"
          v-for="defenseName in Object.keys(character.defenses)"
          :key="defenseName"
      >
        <label class="row-label">{{defenseName}}</label>
        <number-display :value="base(defenseName)"/>
        <div v-if="isImmutable(defenseName)" class="inapplicable"/>
        <number-entry
            v-else
            :value="obj(defenseName).purchased"
            @input="updatePurchased(defenseName, $event)"
        />
        <div v-if="isImmutable(defenseName)" class="inapplicable"/>
        <number-display v-else :value="obj(defenseName).cost"/>
        <number-display :value="obj(defenseName).ranks" :isOutOfSpec="isOutOfSpec(defenseName)"/>
      </div>
    </div>

    <div class="initiative-grid grid-with-lines">
      <label class="row-label">initiative</label>
      <number-display :value="character.initiative"/>
    </div>

  </boxed-section>
</template>

<script>
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
      character: { type: Object, required: true }
    },
    created: function() {
      const recalculate = this.recalculate;
      for (const defenseName in baseValueMap) {
        this.$watch(`character.abilities.${baseValueMap[defenseName]}.ranks`, function() {
          recalculate(defenseName);
        }, {immediate: true});
      }
      this.$watch("character.abilities.agility.ranks", function () {
        this.character.initiative = this.character.abilities.agility.ranks;
      }, {immediate: true});
    },
    methods: {
      // Use within v-for to access the defense
      obj: function(defenseName) {
        return this.character.defenses[defenseName];
      },
      isImmutable: function(defenseName) {
        return defenseName === 'toughness';
      },
      updatePurchased: function(defenseName, newValue) {
        this.obj(defenseName).purchased = newValue;
        this.recalculate(defenseName);
      },
      base: function(defenseName) {
        return this.character.abilities[baseValueMap[defenseName]].ranks;
      },
      recalculate: function(defenseName) {
        const dob = this.obj(defenseName);
        dob.cost = dob.purchased;
        dob.ranks = this.base(defenseName) + dob.purchased;
      },
      isOutOfSpec: function(defenseName) {
        // -- values --
        const powerLevel = this.character.campaign.powerLevel;
        const defenses = this.character.defenses;
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
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
        <label class="row-label grid-with-lines-cell">{{defenseName}}</label>
        <number-display class="grid-with-lines-cell" :value="obj(defenseName).base"/>
        <div v-if="isImmutable(defenseName)" class="inapplicable"/>
        <number-entry
            v-else
            class="grid-with-lines-cell"
            :value="obj(defenseName).purchased"
            @input="updatePurchased(defenseName, $event)"
        />
        <div v-if="isImmutable(defenseName)" class="inapplicable"/>
        <number-display v-else class="grid-with-lines-cell" :value="obj(defenseName).cost"/>
        <number-display class="grid-with-lines-cell" :value="obj(defenseName).ranks" :isOutOfSpec="isOutOfSpec(defenseName)"/>
      </div>
    </div>

    <div class="initiative-grid grid-with-lines">
      <label class="row-label">initiative</label>
      <number-display :value="character.initiative"/>
    </div>

  </boxed-section>
</template>

<script>
  export default {
    name: "Defenses",
    props: {
      character: { type: Object, required: true }
    },
    created: function() {
      const abilities = this.character.abilities;
      const defenses = this.character.defenses;

      this.$watch("character.abilities.agility.ranks", function () {
        defenses.dodge.base = abilities.agility.ranks;
        this.recalculate("dodge");
      }, {immediate: true});
      this.$watch("character.abilities.stamina.ranks", function () {
        defenses.fortitude.base = abilities.stamina.ranks;
        this.recalculate("fortitude");
      }, {immediate: true});
      this.$watch("character.abilities.fighting.ranks", function () {
        defenses.parry.base = abilities.fighting.ranks;
        this.recalculate("parry");
      }, {immediate: true});
      this.$watch("character.abilities.stamina.ranks", function () {
        defenses.toughness.base = abilities.stamina.ranks;
        this.recalculate("toughness");
      }, {immediate: true});
      this.$watch("character.abilities.awareness.ranks", function () {
        defenses.will.base = abilities.awareness.ranks;
        this.recalculate("will");
      }, {immediate: true});
      this.$watch("character.abilities.agility.ranks", function () {
        this.character.initiative = abilities.agility.ranks;
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
      recalculate: function(defenseName) {
        const dob = this.obj(defenseName);
        dob.cost = dob.purchased;
        dob.ranks = dob.base + dob.purchased;
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
  div.display-contents {
    display: contents;
  }
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
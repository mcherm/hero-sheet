<template>
  <BoxedSection title="Defenses and Initiative">

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
        <NumberDisplay class="grid-with-lines-cell" :value="obj(defenseName).base"/>
        <div v-if="isImmutable(defenseName)" class="inapplicable"/>
        <NumberEntry
            v-else
            class="grid-with-lines-cell"
            :value="obj(defenseName).purchased"
            @input="updatePurchased(defenseName, $event)"
        />
        <div v-if="isImmutable(defenseName)" class="inapplicable"/>
        <NumberDisplay v-else class="grid-with-lines-cell" :value="obj(defenseName).cost"/>
        <NumberDisplay class="grid-with-lines-cell" :value="obj(defenseName).ranks"/>
      </div>
    </div>

    <div class="initiative-grid grid-with-lines">
      <label class="row-label">initiative</label>
      <NumberDisplay :value="character.initiative"/>
    </div>

  </BoxedSection>
</template>

<script>
  export default {
    name: "Defenses",
    props: {
      character: { type: Object, required: true }
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
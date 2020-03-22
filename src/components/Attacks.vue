<template>
  <boxed-section title="Attacks">
    <template v-slot:exhibit>
      <local-cost-display :charsheet="charsheet"/>
    </template>
    <div class="attacks-list grid-with-lines">
      <div class="col-label">Attack</div>
      <div class="col-label">To Hit</div>
      <div class="col-label">Resist DC</div>
      <div class="col-label">Effect</div>
      <div
          v-for="(attack, index) in charsheet.attacks.attackList"
          :key="index"
          class="display-contents"
      >
        <div class="attack-name">{{attack.name}}</div>
        <number-display class="to-hit" :value="attack.attackCheck"/>
        <number-display v-if="attack.resistanceDC !== null" class="resistance-dc" :value="attack.resistanceDC"/>
        <div v-else class="inapplicable"></div>
        <div>{{attack.effectType}}</div>
      </div>
    </div>
  </boxed-section>
</template>

<script>
  import LocalCostDisplay from "./LocalCostDisplay";

  export default {
    name: "Attacks",
    components: {
      LocalCostDisplay
    },
    props: {
      charsheet: { type: Object, required: true }
    }
  }
</script>

<style scoped>
  .attacks-list {
    display: inline grid;
    grid-template-columns: max-content max-content max-content max-content;
    justify-items: stretch;
  }
  .attacks-list .attack-name {
    padding: 2px 6px;
  }
  .attacks-list .to-hit {
    margin-left: 0;
  }
  .attacks-list .resistance-dc {
    margin-left: 0;
  }
  .inapplicable {
    background-color: var(--inapplicable-color);
  }
</style>

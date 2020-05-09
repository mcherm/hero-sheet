<template>
  <boxed-section title="Adjustments">
    <template v-slot:exhibit>
      <local-cost-display :charsheet="charsheet"/>
    </template>
    <div class="adjustment-list grid-with-lines">
      <div class="col-label">Affected Trait</div>
      <div class="col-label">Type of Effect</div>
      <div class="col-label">Value</div>
      <div class="display-contents" v-for="(data, affectedTrait) in charsheet.activeEffects">
        <div class="display-contents" v-for="entry of data">
          <div class="grid-with-lines-cell">{{affectedTrait}}</div>
          <div class="grid-with-lines-cell">{{entry.description}}</div>
          <number-display class="value-display grid-with-lines-cell" :value="entry.value"/>
        </div>
      </div>
      <div class="empty-notice" v-if="Object.keys(charsheet.activeEffects).length === 0">No Adjustments</div>
    </div>
  </boxed-section>
</template>

<script>
  import LocalCostDisplay from "./LocalCostDisplay.vue";

  export default {
    name: "Adjustments",
    components: {
      LocalCostDisplay
    },
    props: {
      charsheet: { type: Object, required: true }
    }
  }
</script>

<style scoped>
  .adjustment-list {
    display: inline grid;
    grid-template-columns: max-content max-content max-content;
    justify-items: stretch;
  }
  .adjustment-list div {
    padding: 2px 6px;
  }
  .adjustment-list .value-display {
    margin-left: 0;
  }

</style>
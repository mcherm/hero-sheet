<template>
  <BoxedSection :title="'Campaign'">
    <div class="campaign-fields grid-with-lines">
      <label class="row-label">Power Level</label>
      <div class="spacer">
        <NumberEntry v-model="campaign.powerLevel"/>
        <div class="blank-spot">
          <DocsLookup :docsURL="campaignData.powerLevel.docsURL"/>
        </div>
      </div>
      <label class="row-label">XP Awarded</label>
      <div class="spacer">
        <NumberEntry v-model="campaign.xpAwarded"/>
        <div class="blank-spot">
          <DocsLookup :docsURL="campaignData.experience.docsURL"/>
        </div>
      </div>
      <label class="row-label">Setting</label>
      <StringEntry v-model="campaign.setting" />
    </div>
  </BoxedSection>
</template>

<script>
  import DocsLookup from "./DocsLookup";
  const campaignData = require("../data/campaignData.json");

  export default {
    name: "Campaign",
    components: {DocsLookup},
    props: {
      campaign: { type: Object, required: true }
    },
    data: function() {
      return {
        campaignData
      }
    }
  }
</script>

<style scoped>
  .campaign-fields {
    grid-template-columns: max-content max-content;
  }
  .spacer {
    background-color: var(--inapplicable-color);
    display: flex;
    justify-content: space-between;
  }
  .blank-spot {
    background-color: var(--paper-color);
    padding: 0 10px;
  }
</style>

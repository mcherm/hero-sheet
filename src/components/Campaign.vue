<template>
  <boxed-section title="Campaign">
    <div class="campaign-fields grid-with-lines">
      <label class="row-label">Power Level</label>
      <div class="spacer">
        <number-entry v-model="campaign.powerLevel" :mutable="!editModes.isAlly"/>
        <div class="blank-spot">
          <docs-lookup :docsURL="campaignData.powerLevel.docsURL"/>
        </div>
      </div>
      <label class="row-label">XP Awarded</label>
      <div class="spacer">
        <number-entry v-model="campaign.xpAwarded" :mutable="!editModes.isAlly"/>
        <div class="blank-spot">
          <docs-lookup :docsURL="campaignData.experience.docsURL"/>
        </div>
      </div>
      <label class="row-label">Setting</label>
      <string-entry v-model="campaign.setting" :mutable="!editModes.isAlly"/>
      <label class="row-label">Make Public</label>
      <yes-no-toggle class="grid-with-lines-cell" v-model="getCharsheet().sharing.isPublic"/>
    </div>
  </boxed-section>
</template>

<script>
  const campaignData = require("../data/campaignData.json");

  export default {
    name: "Campaign",
    inject: ["getCharsheet", "editModes"],
    data: function() {
      return {
        campaignData,
        campaign: this.getCharsheet().campaign
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

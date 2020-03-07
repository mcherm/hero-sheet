<template>
  <boxed-section :title="'Naming'">
    <div class="campaign-fields grid-with-lines">
      <label class="row-label">Name</label>
      <string-entry v-model="naming.name"/>
      <label class="row-label">Player</label>
      <string-entry v-model="naming.player"/>
      <label class="row-label">Identity</label>
      <div class="vert-stack">
        <div class="spacer">
          <select v-model="naming.identityType">
            <option value="secret">Secret</option>
            <option value="public">Public</option>
            <option value="none">None</option>
          </select>
        </div>
        <string-entry v-model="naming.identity"/>
      </div>
      <label class="row-label">Gender</label>
      <string-entry v-model="naming.gender"/>
      <label class="row-label">Age</label>
      <string-entry v-model="naming.age"/>
      <label class="row-label">Height/Weight</label>
      <string-entry v-model="naming.heightWeight"/>
      <label class="row-label">Eyes/Hair</label>
      <string-entry v-model="naming.eyesHair"/>
      <label class="row-label">Costume</label>
      <string-entry v-model="naming.costume"/>
      <label class="row-label">Group/Team</label>
      <string-entry v-model="naming.groupAffiliation"/>
      <label class="row-label">Home Base</label>
      <string-entry v-model="naming.baseOfOperations"/>
    </div>
  </boxed-section>
</template>

<script>
  export default {
    name: "Naming",
    props: {
      naming: { type: Object, required: true }
    }
  }
</script>

<style scoped>
  .campaign-fields {
    grid-template-columns: max-content max-content;
  }
  .vert-stack {
    display: flex;
    flex-direction: column;
  }
  .spacer {
    background-color: var(--inapplicable-color);
  }
</style>

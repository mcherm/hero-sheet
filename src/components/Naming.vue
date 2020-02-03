<template>
  <BoxedSection :title="'Naming'">
    <div class="campaign-fields grid-with-lines">
      <label class="row-label">Name</label>
      <StringEntry v-model="naming.name"/>
      <label class="row-label">Player</label>
      <StringEntry v-model="naming.player"/>
      <label class="row-label">Identity</label>
      <div class="vert-stack">
        <div class="spacer">
          <select v-model="naming.identityType">
            <option value="secret">Secret</option>
            <option value="public">Public</option>
            <option value="none">None</option>
          </select>
        </div>
        <StringEntry v-model="naming.identity"/>
      </div>
      <label class="row-label">Gender</label>
      <StringEntry v-model="naming.gender"/>
      <label class="row-label">Age</label>
      <StringEntry v-model="naming.age"/>
      <label class="row-label">Height/Weight</label>
      <StringEntry v-model="naming.heightWeight"/>
      <label class="row-label">Eyes/Hair</label>
      <StringEntry v-model="naming.eyesHair"/>
      <label class="row-label">Costume</label>
      <StringEntry v-model="naming.costume"/>
      <label class="row-label">Group/Team</label>
      <StringEntry v-model="naming.groupAffiliation"/>
      <label class="row-label">Home Base</label>
      <StringEntry v-model="naming.baseOfOperations"/>
    </div>
  </BoxedSection>
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

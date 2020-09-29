<template functional>
  <div class="logo-section">
    <div class="text-logo">
      <span class="level-1">Hero-Sheet</span>
      <span class="level-3"> : Mutants and Masterminds</span>
      <span class="level-2"> : Open Beta Test</span>
    </div>
  </div>
</template>

<script>
  export default {
    name: 'logo-section'
  }
</script>

<style scoped>
  .header button {
    border: solid 1px var(--box-border-color);
    padding: 2px;
    margin: 4px 2px;
  }

  .logo-section {
    background-color: var(--title-color);
    color: rgb(255, 255, 255);
    border: solid 1px var(--box-border-color);
    padding-top: 4px;
    padding-left: 4px;
    padding-right: 4px;
    padding-bottom: 2px;
  }

  .text-logo {
    text-align: center;
    font-size: x-large;
  }

  @media (max-width: 750px) {
    .level-3 {
      display: none;
    }
  }

  @media (max-width: 500px) {
    .level-2 {
      display: none;
    }
  }
</style>

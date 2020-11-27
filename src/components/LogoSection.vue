<template functional>
  <div class="horizontal">
    <div class="logo-section">
      <div class="text-logo">
        <span class="level-1">Hero-Sheet</span>
        <span class="level-3"> : Mutants and Masterminds</span>
        <span class="level-2"> : Open Beta Test</span>
      </div>
    </div>
    <img src="/hero-sheet-logo.svg" class="logo"/>
  </div>
</template>

<script>
  export default {
    name: 'logo-section'
  }
</script>

<style scoped>
  .horizontal {
    display: flex;
  }
  .logo {
    flex: 0 1 auto;
    padding: 2px 2px 2px 6px;
    width: 40px;
    height: 40px;
  }

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
    flex: 1 1 auto;
    display: flex;
    justify-content: center;
    align-items: center;
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

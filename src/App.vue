<template>
  <div id="app">
    <CharacterSheet/>
  </div>
</template>

<script>
  import CharacterSheet from './components/CharacterSheet.vue'

  export default {
    name: 'app',
    components: {
      CharacterSheet
    }
  }
</script>

<style>
  #app {
    --paper-color: rgb(247, 247, 247);
    --entry-field: rgb(146, 240, 105);
    --error-color: rgb(217, 111, 111);
    --section-color: rgb(219, 250, 255);
    --subsection-color: rgb(221, 219, 255);
    --grid-line-color: rgb(0, 0, 0);
    --box-border-color: rgb(0, 0, 0);
    --inapplicable-color: rgb(144, 144, 144);
    font-family: sans-serif;
    font-size: small;
  }
  table {
    border-collapse: collapse;
  }
  .row-label {
    text-transform: capitalize;
    font-weight: bold;
    text-align: right;
    vertical-align: middle;
    padding: 2px 2px 0px 2px;
  }
  .row-label:after {
    content: ":";
  }
  .col-label {
    text-transform: capitalize;
    font-weight: bold;
    text-align: center;
    padding: 2px 2px 0px 2px;
  }
  .grid-with-lines {
    display: grid;
    border: 1px solid var(--grid-line-color);
  }
  .grid-with-lines > * {
    border: 1px solid var(--grid-line-color);
  }
  .grid-with-lines .grid-with-lines-cell {
    border: 1px solid var(--grid-line-color);
  }
  .grid-with-lines .grid-with-lines-no-lines {
    border: 0px;
  }
</style>

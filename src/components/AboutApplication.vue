<template>
  <div>
    <h1>About Hero-Sheet</h1>
    <p>Hero-Sheet is a web application for making character sheets in the game Mutants and Masterminds.</p>
    <h2>Feedback</h2>
    <p>If you have any feedback or suggestions, send an email to <a href="mailto:mcherm@mcherm.com">mcherm@mcherm.com</a>.</p>
    <h2>Recent Changes</h2>
    <ul class="change-list">
      <li>2020-03-16: Created (still slightly buggy) attacks for the damage power.</li>
      <li>2020-03-14: Automated deployment of code changes.</li>
      <li>2020-03-14: Renamed "Hero Points" to "Effort Points" and "Power Points" to "Character Points" for licensing reasons.</li>
      <li>2020-03-14: Created Attacks sheet (with just unarmed attack).</li>
      <li>2020-03-14: Fixed auto-save when there are experimental versions, errors on save, or closing the character.</li>
      <li>2020-03-11: Added Hero Points.</li>
      <li>2020-03-11: Added About page.</li>
    </ul>
  </div>
</template>

<script>
  export default {
    name: "AboutApplication"
  }
</script>

<style scoped>
  .change-list > li {
    list-style-type: none;
  }
</style>
<template>
  <div>
    <h1>About Hero-Sheet</h1>
    <p>Hero-Sheet is a web application for making character sheets in the game Mutants and Masterminds.</p>
    <h2>Feedback</h2>
    <p>If you have any feedback or suggestions, send an email to <a href="mailto:mcherm@mcherm.com">mcherm@mcherm.com</a>.</p>
    <h2>Recent Changes</h2>
    <ul class="change-list">
      <li>2020-03-23: Major improvements to the appearance of extras and flaws during creation.</li>
      <li>2020-03-23: Support special extras and flaws specific to the power (not all data entered yet).</li>
      <li>2020-03-22: Group the effects one can choose for a power.</li>
      <li>2020-03-22: Added documentation for powers (not all data is entered yet).</li>
      <li>2020-03-21: Support attacks for all 4 primitive attack powers.</li>
      <li>2020-03-21: Create and remove attacks properly.</li>
      <li>2020-03-16: Created (still slightly buggy) attacks for the damage power.</li>
      <li>2020-03-14: Automated deployment of code changes.</li>
      <li>2020-03-14: Renamed "Hero Points" to "Effort Points" and "Power Points" to "Character Points" for licensing reasons.</li>
      <li>2020-03-14: Created Attacks sheet (with just unarmed attack).</li>
      <li>2020-03-14: Fixed auto-save when there are experimental versions, errors on save, or closing the character.</li>
      <li>2020-03-11: Added Hero Points.</li>
      <li>2020-03-11: Added About page.</li>
    </ul>
    <h2>Major Features Needed</h2>CBZJHT
    <ul>
      <li>Functioning list of attacks</li>
      <li>Individualized Modifiers for Powers</li>
      <li>Logins for users</li>
      <li>Support for Equipment</li>
      <li>Numerous powers and abilities should impact other fields</li>
      <li>Ability to control which powers are applied</li>
      <li>Manage custom adjustments to various fields</li>
      <li>Support for sidekicks, summons, and morphs</li>
      <li>Printable character sheet</li>
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
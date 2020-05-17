<template>
  <div class="about-box-contents">
    <h1>About Hero-Sheet</h1>
    <p>Hero-Sheet is a web application for making character sheets in the game Mutants and Masterminds.</p>
    <h2>Feedback</h2>
    <p>If you have any feedback or suggestions, send an email to <a href="mailto:hero-sheet@mcherm.com">hero-sheet@mcherm.com</a>.</p>
    <h2>Recent Changes</h2>
    <ul class="change-list scrolling-list">
      <li>2020-05-17: ALL specialized extras and flaws for powers are now created.</li>
      <li>2020-05-16: Specialized extras and flaws for powers up through "Summon".</li>
      <li>2020-05-15: Specialized extras and flaws for powers up through "Senses".</li>
      <li>2020-05-14: Add "Background" on the Complications tab.</li>
      <li>2020-05-13: Can create custom equipment.</li>
      <li>2020-05-10: The ability to view the powers that come packaged with equipment.</li>
      <li>2020-05-09: Support for melee weapons as well as strength-based attack powers.</li>
      <li>2020-05-08: Equipment can now have power effects!</li>
      <li>2020-05-08: All lists now look and work better when empty.</li>
      <li>2020-05-04: Can now add equipment that is based on a power.</li>
      <li>2020-05-04: Create Equipment pane supporting standard equipment with no effects.</li>
      <li>2020-04-29: In Adjustments show helpful string for "Type of Effect".</li>
      <li>2020-04-29: Created an adjustments tab.</li>
      <li>2020-04-22: Specialized extras and flaws for powers up through "Regeneration".</li>
      <li>2020-04-22: Specialized extras and flaws for powers up through "Nullify".</li>
      <li>2020-04-20: Specialized extras and flaws for powers up through "Move Object".</li>
      <li>2020-04-18: Indicate flats (and fifths) when displaying extras and flaws; also docs.</li>
      <li>2020-04-18: Close and Ranged Combat skills can select an attack that they apply to.</li>
      <li>2020-04-17: Support login via email as well as user.</li>
      <li>2020-04-14: Proper support for passwords and logins!</li>
      <li>2020-04-12: Maintains a user session (for now ANY password works).</li>
      <li>2020-04-02: Specialized extras and flaws for powers up through "Luck Control".</li>
      <li>2020-04-01: Jack Of All Trades advantage now affects skill rolls.</li>
      <li>2020-04-01: Enhanced Trait power now applies to everything, including skills.</li>
      <li>2020-03-29: Improve the display of costs on every tab.</li>
      <li>2020-03-29: The Enhanced Trait power applies to the ranks for defenses (but not yet skills).</li>
      <li>2020-03-28: The Enhanced Trait power applies to the ranks for all abilities (but not yet other traits).</li>
      <li>2020-03-28: Support Active Effects. The test use is that "Improved Initiative" improves initiative.</li>
      <li>2020-03-27: Show warning when an attack exceeds the campaign power level limits.</li>
      <li>2020-03-26: Specialized extras and flaws for powers up through "insubstantial".</li>
      <li>2020-03-25: Specialized extras and flaws for powers up through "healing".</li>
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
    <h2>Major Features Needed</h2>
    <ul class="scrolling-list">
      <li>Functioning list of attacks <span class="making-progress">(making progress)</span></li>
      <li>Numerous powers and abilities should impact other fields <span class="making-progress">(making progress)</span></li>
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
  .scrolling-list {
    overflow: auto;
    max-height: 100px;
    border: solid 1px black;
  }
  .change-list > li {
    list-style-type: none;
  }
  .making-progress {
    color: var(--under-development-color);
  }
</style>
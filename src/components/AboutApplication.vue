<template>
  <div class="about-box-contents">
    <h1>About Hero-Sheet</h1>
    <p>Hero-Sheet is a web application for making character sheets in the game Mutants and Masterminds.</p>
    <h2>Feedback</h2>
    <p>If you have any feedback or suggestions, send an email to <a href="mailto:hero-sheet@mcherm.com">hero-sheet@mcherm.com</a>.</p>
    <h2>Recent Changes</h2>
    <ul class="change-list scrolling-list">
      <li>2020-09-01: Make usernames and emails case insensitive.</li>
      <li>2020-09-01: Created separate development environment for doing development without disturbing production.</li>
      <li>2020-08-28: The display of attacks is pretty much working.</li>
      <li>2020-08-27: Major work done to improve the descriptions of attacks.</li>
      <li>2020-07-31: Conditions now get saved AND updated properly.</li>
      <li>2020-07-30: Added Conditions tab for viewing (not yet saving) conditions affecting a character.</li>
      <li>2020-07-26: Create a schema for validating characters. This was a prerequisite for release.</li>
      <li>2020-07-22: Support for constructs and characters who lack particular abilities.</li>
      <li>2020-07-21: Fixed a bug in editing the ranks of advantages.</li>
      <li>2020-07-19: Violations of campaign constraints are now listed and can be disabled with GM permission.</li>
      <li>2020-07-13: Minion editing now works just like sidekicks.</li>
      <li>2020-07-03: Sidekick editing now works properly.</li>
      <li>2020-07-03: For sidekicks, the cost is computed properly.</li>
      <li>2020-07-03: Support sidekicks as an "ally" and show the character sheet.</li>
      <li>2020-07-02: Added developer mode.</li>
      <li>2020-07-02: Added grenades and explosives, which is the last of the equpiment, and fix the cost of equipment.</li>
      <li>2020-07-01: For defenses and initiative, you can enter a manual adjustment.</li>
      <li>2020-06-28: Fixed longstanding bug in the naming of updaters.</li>
      <li>2020-06-27: For stats, you can actually enter a manual adjustment.</li>
      <li>2020-06-21: Stats show a pencil icon that later will allow manual adjustments.</li>
      <li>2020-06-21: Allowed the user to toggle adjustments on and off.</li>
      <li>2020-06-20: Added armor and make the Protection power affect Toughness.</li>
      <li>2020-06-14: Added the rest of the ranged weapons.</li>
      <li>2020-06-10: Added half of the ranged weapons.</li>
      <li>2020-06-09: Runs much faster for users with more than 2 characters.</li>
      <li>2020-05-30: Official Alpha Release</li>
      <li>2020-05-29: Complete the process of adding sample powers and remove the previous way that was done.</li>
      <li>2020-05-24: Add several new sample powers.</li>
      <li>2020-05-20: Support complex sample powers with subpowers.</li>
      <li>2020-05-17: Started to support "sample powers" so they are editable and affect the rest of the charsheet.</li>
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
      <li>Numerous powers and abilities should impact other fields <span class="making-progress">(making progress)</span></li>
      <li>Support for sidekicks, summons, morphs, and variable powers.</li>
      <li>Printable character sheet</li>
    </ul>
    <h2>Special Settings</h2>
    <div class="global-settings grid-with-lines">
      <label for="developerMode">Developer Mode</label>
      <div class="grid-with-lines-cell">
        <input type="checkbox" id="developerMode" v-model="$globals.developerMode">
      </div>
      <label for="deployment">Dev Deployment</label>
      <div class="grid-with-lines-cell">
        <select id="deployment" :value="$globals.deployment" @change="setDeployment($event.target.value)">
          <option value="prod">Production</option>
          <option value="dev">Development</option>
        </select>
      </div>
    </div>
  </div>
</template>

<script>
  import {setDeployment} from "../js/api.js";

  export default {
    name: "AboutApplication",
    data: function() {
      return {
        deployment: "prod"
      }
    },
    methods: {
      setDeployment: function(newValue) {
        setDeployment(newValue);
        this.$globals.deployment = newValue;
      }
    }
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
  .global-settings {
    width: min-content;
    grid-template-columns: max-content max-content;
  }
</style>
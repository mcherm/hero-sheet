<template>
  <boxed-section title="Abilities">
    <div id="stat-display">
      <table>
        <thead>
          <tr>
            <th></th>
            <th class="col-label">Entered</th>
            <th class="col-label">Cost</th>
            <th class="col-label">Ranks</th>
            <th class="col-label">Docs</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(statData, statName) in statsData"
            is="basic-stats-row"
            :key="statName"
            :statName="statName"
            :statObj="abilities[statName]"
            :docsURL="statData.docsURL"
          />
        </tbody>
      </table>
    </div>
  </boxed-section>
</template>

<script>
  import BasicStatsRow from "./BasicStatsRow.vue"

  const statsData = require("../data/statsData.json");

  export default {
    name: "BasicStats",
    props: {
      abilities: { type: Object, required: true }
    },
    data: function() {
      return {
        statsData
      }
    },
    components: {
      BasicStatsRow
    }
  }
</script>

<style scoped>
  th {
    border: 1px solid var(--grid-line-color);
    text-align: center;
  }
</style>

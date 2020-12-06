<template>
  <div class="senses">
    <div class="sense-type-stack">
      <div v-for="senseType in senses" class="sense-type">
        <div class="sense-type-header">{{senseType.name}}</div>
        <senses-chart-sense v-for="sense in senseType.senses" :sense="sense" :mutable="mutable"/>
      </div>
    </div>
    <div v-if="mutable" class="button-bar">
      <edit-button :onClick="() => {}">Add Sense</edit-button>
      <edit-button :onClick="() => {}">Delete Sense</edit-button>
    </div>
  </div>
</template>

<script>
  import SensesChartSense from "./SensesChartSense.vue";
  const sensesData = require("@/data/sensesData.json");

  export default {
    name: "SensesChart",
    components: {
      SensesChartSense,
    },
    props: {
      power: { type: Object, required: false, default: null },
      mutable: { type: Boolean, required: false, default: true }
    },
    inject: ["getCharsheet"],
    data: function() {
      return {
        isAddingMods: false,
        isRemovingMods: false,
        senses: {
          "Visual": {
            "name": "Visual",
            "senses": [
              {
                "name": "Normal Vision",
                "hsid": "HIBM32D1V",
                "qualities": [
                  { "name": "Accurate", },
                  { "name": "Acute" },
                  { "name": "Ranged" },
                ]
              },
              {
                "name": "Infravision",
                "sourceHsid": "HIPS21E13",
                "qualities": [
                  { "name": "Accurate" },
                  { "name": "Acute" },
                  { "name": "Ranged" },
                ]
              }
            ],
            "qualities": [
              {
                "name": "Low Light",
                "sourceHsid": "HIRNWDYKE"
              },
            ]
          },
          "Auditory": {
            "name": "Auditory",
            "senses": [
              {
                "name": "Normal Hearing",
                "hsid": "HIBM32D1V",
                "qualities": [
                  { "name": "Acute" },
                  { "name": "Radius" },
                  { "name": "Ranged" },
                  {
                    "name": "Rapid",
                    "ranks": 2,
                    "sourceHsid": "HIVDVETL6"
                  },
                  {
                    "name": "Penetrates Concealment",
                    "sourceHsid": "HINC8D3G8"
                  },
                ]
              }
            ],
            "qualities": []
          },
          "Olfactory": {
            "name": "Olfactory",
            "senses": [
              {
                "name": "Normal Smell/Taste",
                "hsid": "HIS8Q8CN9",
                "qualities": [
                  { "name": "Radius" },
                ]
              }
            ],
            "qualities": []
          },
          "Tactile": {
            "name": "Tactile",
            "senses": [
              {
                "name": "Normal Touch",
                "hsid": "HIPC11GKW",
                "qualities": [
                  { "name": "Accurate" },
                  { "name": "Radius" },
                ]
              }
            ],
            "qualities": []
          },
          "Mental": {
            "name": "Mental",
            "senses": [
              {
                "name": "Normal Mental Awareness",
                "hsid": "HIQ1JK369",
                "qualities": []
              }
            ],
            "qualities": []
          }
        },
        sensesData,
      }
    },
    methods: { // FIXME: Remove
      /*
       * Return true if the quality with this hsid exists and can be deleted given the
       * current state of the senses panel.
       */
      isQualityEditableHere: function(senseType, sense, qualityHsid) {
        console.log(`senseType: ${JSON.stringify(senseType)}, sense: ${JSON.stringify(sense)}, qualityHsid: ${qualityHsid}`); // FIXME: Remove
        return this.mutable && qualityHsid !== undefined; // FIXME: Real test needed
      },
      /*
       * Removes the quality indicated by the qualityHsid.
       * // FIXME: Needs to work on sense-type level qualities if sense is passed as null.
       */
      deleteQuality: function(senseType, sense, qualityHsid) {
        console.log(`senseType: ${JSON.stringify(senseType)}, sense: ${JSON.stringify(sense)}, qualityHsid: ${qualityHsid}`); // FIXME: Remove
        const qualities = this.senses[senseType].senses[sense].qualities;
        const positionToDelete = qualities.findIndex(q => q.hsid === qualityHsid);
        this.$delete(qualities, positionToDelete);
      },
    }
  }
</script>

<style scoped>
  .sense-type-stack {
    display: flex;
    flex-direction: column;
    border: 1px solid var(--box-border-color);
  }

  .sense-type {
  }

  .sense-type-header {
    background-color: var(--subtle-shade-color);
    padding: 2px;
  }

  .button-bar {
    display: flex;
    justify-content: center;
  }
</style>

<template>
  <boxed-section title="Ranks and Measures">
    <div class="section-column">
      <div class="ranks-and-measures grid-with-lines">
        <div class="col-label">Rank</div>
        <div class="col-label">Mass</div>
        <div class="col-label">Time</div>
        <div class="col-label">Distance</div>
        <div class="col-label">Volume</div>
        <div class="display-contents" v-for="rankData of isMetric ? ranksDataMetric : ranksDataEnglish">
          <div>{{rankData[0]}}</div>
          <div>{{rankData[1]}}</div>
          <div>{{rankData[2]}}</div>
          <div>{{rankData[3]}}</div>
          <div>{{rankData[4]}}<sup>3</sup></div>
        </div>
      </div>
      <edit-button class="toggle-button" :on-click="() => {isMetric = !isMetric;}" :is-navigation="false" >Toggle Units</edit-button>
    </div>
  </boxed-section>
</template>

<script>
  export default {
    name: "RanksAndMeasures",
    data: function() {
      return {
        isMetric: false,
        ranksDataEnglish: [
          [-5, "1.5 lb.", "1/8 sec.", "6 inches", "1/32 ft."],
          [-4, "3 lb.", "1/4 sec.", "1 ft", "1/16 ft"],
          [-3, "6 lb.", "1/2 sec.", "3 ft", "1/8 ft"],
          [-2, "12 lb.", "1 sec.", "6 ft", "1/4 ft"],
          [-1, "25 lb.", "3 sec.", "15 ft", "1/2 ft"],
          [0, "50 lb.", "6 sec.", "30 ft", "1 ft"],
          [1, "100 lb.", "12 sec.", "60 ft", "2 ft"],
          [2, "200 lb.", "30 sec.", "120 ft", "4 ft"],
          [3, "400 lb.", "1 min.", "250 ft", "8 ft"],
          [4, "800 lb.", "2 min.", "500 ft", "15 ft"],
          [5, "1,600 lb.", "4 min.", "900 ft", "30 ft"],
          [6, "3,200 lb.", "8 min.", "1,800 ft", "60 ft"],
          [7, "3 ton", "15 min.", "1/2 mi", "125 ft"],
          [8, "6 ton", "30 min.", "1 mi", "250 ft"],
          [9, "12 ton", "1 hr.", "2 mi", "500 ft"],
          [10, "25 ton", "2 hr.", "4 mi", "1,000 ft"],
          [11, "50 ton", "4 hr.", "8 mi", "2,000 ft"],
          [12, "100 ton", "8 hr.", "16 mi", "4,000 ft"],
          [13, "200 ton", "16 hr.", "30 mi", "8,000 ft"],
          [14, "400 ton", "1 day", "60 mi", "15,000 ft"],
          [15, "800 ton", "2 day", "120 mi", "32,000 ft"],
          [16, "1,600 ton", "4 day", "250 mi", "65,000 ft"],
          [17, "3.2 kton", "1 week", "500 mi", "125,000 ft"],
          [18, "6 kton", "2 week", "1,000 mi", "250,000 ft"],
          [19, "12 kton", "1 month", "2,000 mi", "500,000 ft"],
          [20, "25 kton", "2 month", "4,000 mi", "1 million ft"],
          [21, "50 kton", "4 month", "8,000 mi", "2 million ft"],
          [22, "100 kton", "8 month", "16,000 mi", "4 million ft"],
          [23, "200 kton", "1.5 yr.", "32,000 mi", "8 million ft"],
          [24, "400 kton", "3 yr.", "64,000 mi", "15 million ft"],
          [25, "800 kton", "6 yr.", "125,000 mi", "32 million ft"],
          [26, "1,600 kton", "12 yr.", "250,000 mi", "65 million ft"],
          [27, "3,200 kton", "25 yr.", "500,000 mi", "125 million ft"],
          [28, "6,400 kton", "50 yr.", "1 million mi", "250 million ft"],
          [29, "12,500 kton", "100 yr.", "2 million mi", "500 million ft"],
          [30, "25,000 kton", "200 yr.", "4 million mi", "1 billion ft"],
        ],
        ranksDataMetric: [
          [-5, "750 g", "1/8 sec.", "15 cm", "0.0008 m"],
          [-4, "1.5 kg", "1/4 sec.", "50 cm", "0.0017 m"],
          [-3, "3 kg", "1/2 sec.", "1 m", "0.0035 m"],
          [-2, "6 kg", "1 sec.", "2 m", "0.007 m"],
          [-1, "12 kg", "3 sec.", "4 m", "0014 m"],
          [0, "24 kg", "6 sec.", "8 m", "0.025 m"],
          [1, "50 kg", "12 sec.", "16 m", "0.05 m"],
          [2, "100 kg", "30 sec.", "32 m", "0.1 m"],
          [3, "200 kg", "1 min.", "64 m", "0.2 m"],
          [4, "400 kg", "2 min.", "125 m", "0.4 m"],
          [5, "800 kg", "4 min.", "250 m", "0.8 m"],
          [6, "1,600 kg", "8 min.", "500 m", "1.7 m"],
          [7, "3.2 ton", "15 min.", "1 km", "3.5 m"],
          [8, "6 ton", "30 min.", "2 km", "7 m"],
          [9, "12 ton", "1 hr.", "4 km", "15 m"],
          [10, "25 ton", "2 hr.", "8 km", "30 m"],
          [11, "50 ton", "4 hr.", "16 km", "60 m"],
          [12, "100 ton", "8 hr.", "32 km", "120 m"],
          [13, "200 ton", "16 hr.", "64 km", "250 m"],
          [14, "400 ton", "1 day", "125 km", "500 m"],
          [15, "800 ton", "2 day", "250 km", "1,000 m"],
          [16, "1,600 ton", "4 day", "500 km", "2,000 m"],
          [17, "3.2 kton", "1 week", "1,000 km", "4,000 m"],
          [18, "6 kton", "2 week", "2,000 km", "8,000 m"],
          [19, "12 kton", "1 month", "4,000 km", "15,000 m"],
          [20, "25 kton", "2 month", "8,000 km", "30,000 m"],
          [21, "50 kton", "4 month", "16,000 km", "60,000 m"],
          [22, "100 kton", "8 month", "32,000 km", "120,000 m"],
          [23, "200 kton", "1.5 yr.", "64,000 km", "250,000 m"],
          [24, "400 kton", "3 yr.", "125,000 km", "500,000 m"],
          [25, "800 kton", "6 yr.", "250,000 km", "1 million m"],
          [26, "1,600 kton", "12 yr.", "500,000 km", "2 million m"],
          [27, "3,200 kton", "25 yr.", "1 million km", "4 million m"],
          [28, "6,400 kton", "50 yr.", "2 million km", "8 million m"],
          [29, "12,500 kton", "100 yr.", "4 million km", "15 million m"],
          [30, "25,000 kton", "200 yr.", "8 million km", "30 billion m"],
        ],
      };
    },
  }
</script>

<style scoped>
  .boxed-section > .section-column {
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    background-color: var(--section-color);
  }
  .boxed-section > .section-column > .ranks-and-measures {
    background-color: var(--paper-color);
  }
  .ranks-and-measures {
    display: inline grid;
    grid-template-columns: max-content max-content max-content max-content max-content;
    overflow-y: scroll;
    height: 115px;
  }
  .ranks-and-measures div {
    padding: 2px;
  }
  .toggle-button {
    margin-top: 5px;
  }
</style>

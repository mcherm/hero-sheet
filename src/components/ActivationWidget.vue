<!--
  A control that is used to turn powers on and off.
-->
<template>
  <div class="activate-widget column">
    <svg
        xmlns='http://www.w3.org/2000/svg'
        width='16'
        height='32'
        viewBox='0 0 512 1024'
    >
      <rect class="outside" x="20" y="20" width="472" height="720" rx="80"/>
      <g class="on-symbol" v-if="activation.activationStatus === 'on'">
        <circle class="edge" r="150" cx="256" cy="230"/>
        <line x1="256" :y1="230-60" x2="256" :y2="230+60"/>
        <line :x1="256 - 60" y1="230" :x2="256 + 60" y2="230"/>
        <line x1="80" y1="500" x2="432" y2="500"/>
        <line x1="80" y1="580" x2="432" y2="580"/>
        <line x1="80" y1="660" x2="432" y2="660"/>
      </g>
      <g class="off-symbol" v-if="activation.activationStatus === 'off'">
        <circle class="edge" r="150" cx="256" cy="530"/>
        <line :x1="256 - 60" y1="530" :x2="256 + 60" y2="530"/>
        <line x1="80" y1="100" x2="432" y2="100"/>
        <line x1="80" y1="180" x2="432" y2="180"/>
        <line x1="80" y1="260" x2="432" y2="260"/>
      </g>
      <g class="partial" v-if="activation.activationStatus === 'partial'">
        <polygon points="80,1003 256,803 432,1003"/>
        <line x1="80" y1="100" x2="432" y2="100"/>
        <line x1="80" y1="180" x2="432" y2="180"/>
        <line x1="80" y1="260" x2="432" y2="260"/>
        <line x1="80" y1="340" x2="432" y2="340"/>
        <line x1="80" y1="420" x2="432" y2="420"/>
        <line x1="80" y1="500" x2="432" y2="500"/>
        <line x1="80" y1="580" x2="432" y2="580"/>
        <line x1="80" y1="660" x2="432" y2="660"/>
      </g>
      <g v-if="canBePartial">
        <line x1="256" y1="740" x2="256" y2="803"/>
        <line x1="256" y1="803" x2="80" y2="1003"/>
        <line x1="256" y1="803" x2="432" y2="1003"/>
        <line x1="80" y1="1003" x2="432" y2="1003"/>
      </g>
      <rect class="click-catcher" x="4" y="4" width="504" height="752" rx="96" @click="clickOnOff()"/>
      <rect class="click-catcher" x="4" y="787" width="504" height="232" rx="96" @click="clickPartial()"/>
    </svg>
    <div class="active-ranks-setting" v-if="activation.activationStatus === 'partial'">
      <edit-button class="active-ranks-button top" :onClick="() => clickIncr()">+</edit-button>
      <number-display class="active-ranks" :value="activation.ranks" :used-in-play="true"/>
      <edit-button class="active-ranks-button bottom" :onClick="() => clickDecr()">-</edit-button>
    </div>
  </div>
</template>

<script>

  // What you go to if you click the "on/off" section of the widget
  const ON_OFF_MAPPING = {
    "on": "off",
    "off": "on",
    "partial": "on",
  };

  // What you go to if you click the "partial" section of the widget
  const PARTIAL_MAPPING = {
    "on": "partial",
    "off": "partial",
    "partial": "partial",
  }

  export default {
    name: "ActivationWidget",
    props: {
      activation: { "type": Object, "required": true },
      canBePartial: { "type": Boolean, "required": true },
    },
    methods: {
      clickOnOff: function() {
        const newActivationStatus = ON_OFF_MAPPING[this.activation.activationStatus];
        this.$emit("setFeatureActivation", newActivationStatus);
      },
      clickPartial: function() {
        if (this.canBePartial) {
          const newActivationStatus = PARTIAL_MAPPING[this.activation.activationStatus];
          if (newActivationStatus !== this.activation.activationStatus) {
            this.$emit("setFeatureActivation", newActivationStatus);
          }
        }
      },
      clickIncr: function() {
        this.$emit("setFeatureActivation", "incr");
      },
      clickDecr: function() {
        this.$emit("setFeatureActivation", "decr");
      },
    },
  }
</script>

<style scoped>
  line {
    stroke: #000;
    stroke-linecap: round;
    stroke-miterlimit: 10;
    stroke-width: 32px;
  }
  rect.outside {
    fill: none;
    stroke: #000;
    stroke-width: 32px;
  }
  circle.edge {
    fill: none;
    stroke: #000;
    stroke-width: 32px;
  }
  polygon {
    fill: #000;
  }
  .click-catcher {
    fill: #FFFFFF00;
    stroke: none;
  }

  .activate-widget {
    background-color: var(--in-play-entry-field);
    padding: 5px;
    border-radius: 5px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }
  .active-ranks-setting {
    display: flex;
    flex-direction: column;
    align-items: stretch;
  }
  .active-ranks {
    border: solid var(--box-border-color) 1px;
  }
  .number-display.active-ranks {
    padding: 2px;
  }
  button.active-ranks-button {
    padding: 0;
    margin: 0;
  }
  button.active-ranks-button.top {
    border-radius: 5px 5px 0 0;
  }
  button.active-ranks-button.bottom {
    border-radius: 0 0 5px 5px;
  }
</style>
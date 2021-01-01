<template>
  <div class="display-contents">
    <ul class="power-list">
      <li v-for="(power, powerIndex) in powers" :key="power.name">
        <div class="power-list-row">
          <div
              class="activate-pane"
              :class="{'partial': power.activation.activationStatus === 'partial', 'off': power.activation.activationStatus === 'off'}"
          >
            <activation-widget
                v-if="getStandardPower(power) !== null"
                :activation="power.activation"
                :can-be-partial="getStandardPower(power).canBePartial"
                @setFeatureActivation="setFeatureActivation(getCharsheet(), power, $event)"
            />
          </div>
          <power
            :power="power"
            :inherited-modifier-lists="inheritedModifierLists"
            :mutable="mutable"
            v-on:update:name="renamePower(power, $event)"
          />
          <edit-button class="trash-button" v-if="deleteIsVisible" :onClick="() => deletePower(powerIndex)">
            <trash-icon/>
          </edit-button>
        </div>
      </li>
    </ul>
    <div class="scrolling-list-footer">
      <edit-button :onClick="addPower" :disabled="!mutable">Add Power</edit-button>
      <edit-button v-if="powers.length > 0" :onClick="() => deleteIsVisible = !deleteIsVisible" :disabled="!mutable">
        <span v-if="deleteIsVisible">Done Deleting</span>
        <span v-else>Delete</span>
      </edit-button>
    </div>
  </div>
</template>

<script>
  import {newBlankPower} from "../js/heroSheetVersioning.js";
  import {setFeatureActivation, getStandardPower} from "@/js/heroSheetUtil.js";
  import ActivationWidget from "@/components/ActivationWidget";

  export default {
    name: "PowerList",
    components: {
      ActivationWidget
    },
    inject: ["getCharsheet"],
    props: {
      powers: { type: Array, required: true },
      inheritedModifierLists: { type: Array, required: true },
      mutable: { type: Boolean, required: false, default: true }
    },
    data: function() {
      return {
        deleteIsVisible: false,
        setFeatureActivation,
      }
    },
    methods: {
      getStandardPower,
      addPower: function() {
        const blankPower = newBlankPower();
        this.powers.push(blankPower);
        const newPower = this.powers[this.powers.length - 1];
        this.renamePower(newPower, newPower.name);
      },
      /*
       * Called when a power gets a new name. It enforces a rule that
       * the name must be unique before applying the update, possibly
       * changing the name if needed to make it unique. Changing it
       * is done by appending ":2", EXCEPT that if it already ends in
       * ":" and a number, then it finds the lowest unused number
       * (eg: ":3") and uses that. It also removes any "|" characters
       * because "|" is reserved in names.
       */
      renamePower: function(power, newName) {
        newName = newName.replace(/\|/g, ""); // replace all "|"s with "".
        const otherPowerNames = {};
        for (let p of this.powers) {
          if (p !== power) {
            otherPowerNames[p.name] = true
          }
        }
        const isDupName = otherPowerNames.hasOwnProperty(newName);
        if (!isDupName) {
          power.name = newName;
        } else {
          const regex = RegExp("^(.*):(\\d)+$");
          const match = newName.match(regex);
          let rootName = newName;
          let counter = 2;
          if (match) {
            rootName = match[1];
            counter = parseInt(match[2]) + 1;
          }
          let altName = rootName + ":" + counter.toString();
          while (otherPowerNames.hasOwnProperty(altName)) {
            counter += 1;
            altName = rootName + ":" + counter.toString();
          }
          power.name = altName;
        }
      },
      /*
       * Deletes the power at position index.
       */
      deletePower: function(powerIndex) {
        if (powerIndex < 0 || powerIndex >= this.powers.length) {
          throw Error("Attempting to delete a power beyond the list size.")
        }
        this.$delete(this.powers, powerIndex);
        if (this.powers.length === 0) {
          this.deleteIsVisible = false;
        }
      },
    }
  }
</script>

<style scoped>
  div.power-list {
    border: 1px solid black;
    padding: 5px;
    margin: 5px;
  }
  ul.power-list {
    list-style-type: none;
    padding: 0;
    margin: 0;
  }
  .scrolling-list-footer {
    text-align: center;
  }
  .power-list-cost {
    margin: 0px 4px;
    border: 1px solid black;
    padding: 2px 4px;
    border-radius: 5px;
  }
  div.power-list-row {
    display: flex;
  }
  div.power-list-row .power {
    flex: 1;
  }
  .activate-pane {
    background-color: var(--paper-color);
    margin: 5px 0 5px 5px;
    border-radius: 5px 0 0 5px;
    border: solid var(--box-border-color) 1px;
    min-width: 32px; /* just wide enough for the widget; matters only if the widget isn't rendered. */
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }
  .activate-pane.off {
    border-style: dashed;
    background-color: var(--subtle-shade-color);
  }
  .activate-pane.partial {
    border-style: dotted;
  }
  .trash-button {
    background-color: var(--paper-color);
    margin: 5px;
  }
</style>

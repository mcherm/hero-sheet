<template>
  <div class="selection-data">
    <div v-for="selectionLayout of selectionLayoutsUsed" class="selection">
      <label :class="{disabled: isDisabled(selectionLayout.name)}">
        <input
            type="checkbox"
            :checked="isChecked(selectionLayout.name)"
            @change="toggleChecked(selectionLayout.name)"
            :disabled="isDisabled(selectionLayout.name)"
        /> {{selectionLayout.name}} ({{selectionLayout.ranks}})</label>
    </div>
  </div>
</template>

<script>
  const selectionLayouts = require("@/data/selectionLayouts.json");

  export default {
    name: "PowerLayoutSelection",
    props: {
      power: { type: Object, required: true },
      mutable: { type: Boolean, required: false, default: true }
    },
    computed: {
      selectionLayoutsUsed: function() {
        return selectionLayouts[this.power.effect].selections;
      }
    },
    mounted: function() {
      this.$nextTick(this.layoutTable);
      window.addEventListener("resize", this.layoutTable);
    },
    methods: {
      /* Returns true if the given selection should be checked; false if not. */
      isChecked: function(selectionName) {
        return this.power.extended.selectedFeatures.includes(selectionName);
      },
      /* Returns true if the given selection should be disabled; false if not. */
      isDisabled: function(selectionName) {
        const selectionLayout = this.selectionLayoutsUsed[selectionName];
        // -- disabled if any prerequisite is not met --
        const prerequisites = selectionLayout.prerequisites;
        if (prerequisites) {
          for (const prerequisite of prerequisites) {
            if (!this.power.extended.selectedFeatures.includes(prerequisite)) {
              return true;
            }
          }
        }
        // -- disabled if any selected item invalidates this --
        for (const otherSelection of this.power.extended.selectedFeatures) {
          const invalidates = this.selectionLayoutsUsed[otherSelection].invalidates;
          if (invalidates) {
            for (const invalidate of invalidates) {
              if (invalidate === selectionName) {
                return true;
              }
            }
          }
        }
        return false;
      },
      /* Called when a checkbox is clicked. */
      toggleChecked: function(selectionName) {
        const selectedFeatures = this.power.extended.selectedFeatures;
        const featuresToUncheck = []; // Collect a list of other features to uncheck
        const pos = selectedFeatures.indexOf(selectionName);
        if (pos === -1) {
          // -- Add the feature they clicked on --
          selectedFeatures.push(selectionName);
          // -- Need to also remove any features that this invalidates --
          const invalidates = this.selectionLayoutsUsed[selectionName].invalidates;
          if (invalidates) {
            for (const invalidated of invalidates) {
              if (selectedFeatures.includes(invalidated)) {
                featuresToUncheck.push(invalidated);
              }
            }
          }
        } else {
          // -- Remove the feature they clicked on --
          selectedFeatures.splice(pos, 1);
          // -- Need to ALSO remove any features this was a prerequisite for --
          for (const otherFeature of selectedFeatures) {
            const prerequisites = this.selectionLayoutsUsed[otherFeature].prerequisites;
            if (prerequisites && prerequisites.includes(selectionName)) {
              featuresToUncheck.push(otherFeature);
            }
          }
        }
        // -- Now uncheck the ones we need to --
        while (featuresToUncheck.length > 0) {
          const featureToRemove = featuresToUncheck.pop();
          const posToRemove = selectedFeatures.indexOf(featureToRemove);
          selectedFeatures.splice(posToRemove, 1);
        }
      },
      /*
       * This sets grid-template-rows and grid-template-columns. I couldn't figure out
       * how to make CSS lay it out properly so I had to compute it.
       *
       * What we want is to make the selections wide enough to fit the longest one, then
       * maximize the number of columns that will fit, then lay things out in column order.
       */
      layoutTable: function() {
        const gridElem = this.$el;
        const numSelections = gridElem.children.length;
        // --- Lay it out so we can measure the minimum width of each child ---
        gridElem.style["grid-template-rows"] = "min-content";
        gridElem.style["grid-template-columns"] = "min-content";
        let largestWidth = 0;
        for (const childElem of gridElem.children) {
          const childWidth = childElem.offsetWidth;
          if (childWidth > largestWidth) {
            largestWidth = childWidth;
          }
        }
        // --- Lay it out so we can measure the natural width of the grid ---
        gridElem.style["grid-template-rows"] = `repeat(${numSelections}, auto)`;
        gridElem.style["grid-template-columns"] = "min-content";
        let gridWidth = gridElem.offsetWidth;
        // --- Lay it out in rows and columns ---
        const numColumns = Math.floor(gridWidth / largestWidth);
        const numRows = Math.ceil(numSelections / numColumns);
        gridElem.style["grid-template-rows"] = `repeat(${numRows}, min-content)`;
        gridElem.style["grid-template-columns"] = `repeat(${numColumns}, ${largestWidth}px)`;
      }
    },
  }
</script>

<style scoped>
  .selection-data {
    display: grid;
    grid-auto-flow: column;
    grid-template-rows: min-content;
    grid-template-columns: min-content;
  }
  .selection {
    border-width: 1px;
    border-style: solid;
    border-color: var(--grid-line-color);
    display: flex;
    align-items: baseline;
    white-space: nowrap;
    padding-right: 2px;
  }
  label.disabled {
    color: var(--disabled-text-color);
  }
</style>

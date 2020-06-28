<!--
  This is like a NumberDisplay, except that it allows for users to make
  edits to the value.
-->
<template>
  <div class="modifiable-number-display">
    <pencil-icon :is-modified="isModified" @icon-click="iconClick()"/>
    <number-display :value="value" :is-out-of-spec="isOutOfSpec" :show-err-for-negatives="showErrForNegatives"/>
    <modal-lightbox
      v-if="isShowingModal"
      v-on:exit="onModalExit"
      :button-names="['Cancel', 'Modify']"
    >
      <modify-number-modal v-model="modalData"/>
    </modal-lightbox>
  </div>
  
</template>

<script>
  import ModifyNumberModal from "./ModifyNumberModal.vue";

  export default {
    name: "ModifiableNumberDisplay",
    components: {
      ModifyNumberModal
    },
    props: {
      value: { required: true, validator: x => x === undefined || x === null || typeof x === "number" },
      isOutOfSpec: { type: Boolean, required: false, default: false },
      showErrForNegatives: { type: Boolean, required: false, default: true },
      isModified: { type: Boolean, required: true }
    },
    data: function() {
      return {
        isShowingModal: false,
        modalData: {
          value: 0,
          description: ""
        }
      };
    },
    methods: {
      iconClick: function() {
        if (this.isModified) {
          // Stop being modified
          this.$emit('remove-manual-adjustment');
        } else {
          // Begin being modified
          this.isShowingModal = true;
        }
      },
      onModalExit: function(buttonClicked) {
        this.isShowingModal = false;
        if (buttonClicked === null || buttonClicked === "Cancel") {
          // Do nothing!
        } else if (buttonClicked === "Modify") {
          // They are creating a new modification!
          if (this.modalData.value !== 0) {
            // Yep, really creating one
            this.$emit('add-manual-adjustment', this.modalData);
          }
        } else {
          throw new Error(`Invalid button clicked from dialog: ${buttonClicked}.`);
        }
      }
    }
  }
</script>

<style scoped>
  .modifiable-number-display {
    display: flex;
  }
</style>
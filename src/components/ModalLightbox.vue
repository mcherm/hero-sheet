<!--
  A lightbox effect to display a modal dialog. The dialog to show is
  provided in the main slot.

  This exits by emitting an "exit" event. Listeners only need to listen
  for that event and then remove the lightbox. However, for added
  functionality (like dialog boxes), the event will come with a
  parameter that says which button was clicked (or null if the modal
  was dismissed by clicking outside the lightbox).

  The lightbox has NO required parameters, but there are some that can
  be provided for extra functionality. A list of strings called buttonNames
  can be provided to have a list of buttons for exiting. The LAST name
  in the list is the default value.
-->
<template>
  <div class="modal-shade" @click="$emit('exit', null)">
    <div class="modal-content" @click.stop="">
      <slot/>
      <div class="button-row">
        <button
          v-for="buttonName in buttonNames"
          @click="$emit('exit', buttonName)"
        >{{buttonName}}</button>
      </div>
    </div>
  </div>
</template>

<script>
  export default {
    name: "ModalLightbox",
    props: {
      buttonNames: { type: Array, required: false, default: ["Done"] },
    }
  }
</script>

<style scoped>
  .modal-shade {
    position: fixed;
    z-index: 1;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    overflow: auto;
    background-color: var(--lightbox-shade-color);
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .modal-content {
    background-color: var(--paper-color);
    padding: 6px;
    border: 3px solid var(--box-border-color);
    overflow: scroll;
    max-height: 90%;
    max-width: 90%;
  }
  .button-row {
    margin-top: 6px;
    display: flex;
    flex-direction: row;
    justify-content: flex-end;
  }
</style>
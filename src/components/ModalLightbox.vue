<template>
  <div class="modal-shade" @click="$emit('exit')">
    <div class="modal-content" @click.stop="">
      <slot/>
      <div class="button-row">
        <button @click="$emit('exit')">Done</button>
      </div>
    </div>
  </div>
</template>

<script>
  export default {
    name: "ModalLightbox"
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
    display: flex;
    flex-direction: row-reverse;
  }
</style>
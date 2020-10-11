<!--
  This is a reusable UI component for making a button (with text on it) which, when you click on it,
  opens up a small interactive window for setting some things in it.

  FIXME: Currently it always anchors to the top-right corner of the button; should make that flexible.
-->
<template>
  <div class="display-contents">
    <button class="activity-button" @click="revealContents" :is-navigation="true">{{label}}</button>
    <div v-if="showContents" class="modal-shade" @click="concealContents">
      <div class="modal-content" @click.stop="">
        <div class="modal-title">{{label}}</div>
        <div class="modal-body">
          <slot/>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  export default {
    name: "ActivityButton",
    props: {
      label: { type: String, required: true },
    },
    data: function() {
      return {
        showContents: false,
      };
    },
    methods: {
      revealContents: function() {
        this.showContents = true;
        this.$nextTick(() => {
          const buttonRect = this.$el.querySelector("button").getBoundingClientRect();
          const contentEl = this.$el.querySelector(".modal-content");
          const contentRect = contentEl.getBoundingClientRect();
          const topSide = buttonRect.y; // match top of button
          const leftSide = buttonRect.left + buttonRect.width - contentRect.width; // match right of button
          contentEl.style.setProperty("top", `${topSide}px`);
          contentEl.style.setProperty("left", `${leftSide}px`);
        });
      },
      concealContents: function() {
        this.showContents = false;
      }
    }
  }
</script>

<style scoped>
  .activity-button {
    border: solid 1px var(--box-border-color);
    padding: 2px;
    margin: 4px 2px;
    background-color: var(--button-color);
  }

  .modal-shade {
    position: absolute;
    z-index: 1;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    overflow: auto;
    background-color: var(--subtle-lightbox-shade-color);
  }

  .modal-content {
    background-color: var(--paper-color);
    border: 3px solid var(--box-border-color);
    overflow: scroll;
    max-height: 90%;
    max-width: 90%;
    position: fixed;
  }

  .modal-title {
    border-bottom: 1px solid var(--box-border-color);
    padding: 2px 4px;
    text-align: center;
  }

  .modal-body {
    padding: 4px;
    display: flex;
    flex-direction: column;
    align-items: stretch;
  }
</style>

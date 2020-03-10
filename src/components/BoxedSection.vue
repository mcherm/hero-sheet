<!--
  Display a section of the app in a box with a title.

  You can provide a title (optional but usually used) and
  a slot for "exhibit" (content to be displayed in the top-right
  corner).
-->
<template>
  <div class="boxed-section">
    <div class="top-row">
      <div class="title">{{title}}</div>
      <div class="exhibit"><slot name="exhibit"></slot></div>
    </div>
    <slot/>
  </div>
</template>

<script>
  export default {
    name: "BoxedSection",
    props: {
      title: { type: String, default: "" }
    }
  }
</script>

<style scoped>
  .boxed-section {
    border: 1px solid var(--box-border-color);
    padding: 5px;
    margin: 5px;
    background-color: var(--section-color);
  }
  .boxed-section > * {
    background-color: var(--paper-color);
  }
  .top-row {
    display: flex;
    flex-wrap: wrap-reverse;
    background-color: var(--section-color);
    justify-content: space-between;
    margin: 3px 0;
  }
  .exhibit {
    align-self: flex-end;
  }
  .title {
    font-size: larger;
    align-self: flex-start;
  }
</style>

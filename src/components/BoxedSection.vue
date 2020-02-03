<!--
  Display a section of the app in a box with a title.
-->
<template>
  <div class="boxed-section">
    <div class="title">{{title}}</div>
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
  .title {
    background-color: var(--section-color);
    font-size: larger;
  }
</style>

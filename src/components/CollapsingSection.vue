<template>
  <div class="collapsing-section grid-with-lines">
    <div
        class="top-bar col-label"
        @click="isOpen = !isOpen"
        :style="`grid-column-end: span ${columns}; grid-template-columns: repeat(${columns}, max-content);`"
    >{{title}} [{{isOpen ? "-" : "+"}}]</div>
    <slot v-if="isOpen"></slot>
  </div>
</template>

<script>
  export default {
    name: "CollapsingSection",
    props: {
      title: { type: String, default: "" },
      columns: { type: Number, default: 1 },
    },
    data: function() {
      return {
        isOpen: false,
      }
    },
  }
</script>

<style scoped>
  .collapsing-section > * {
    padding: 2px;
  }
</style>

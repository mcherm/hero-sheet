<template functional>
  <svg class="close-icon" xmlns="http://www.w3.org/2000/svg" width="12px" height="12px" viewBox="0 0 16 16">
    <circle cx="8" cy="8" r="7"/>
    <line x1="12.95" y1="12.95" x2="3.05" y2="3.05"/>
    <line x1="12.95" y1="3.05" x2="3.05" y2="12.95"/>
  </svg>
</template>

<script>
  export default {
    name: "CloseIcon",
  }
</script>

<style scoped>
  circle {
    stroke: #000000;
    stroke-width: 1px;
    fill: none;
  }
  line {
    stroke: #000000;
    stroke-width: 1px;
  }
</style>

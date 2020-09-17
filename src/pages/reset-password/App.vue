<template>
  <div id="app">
    <logo-section/>
    <h1>Reset Password</h1>
    <p>This is the thing that does it.</p>
  </div>
</template>

<script>
  import LogoSection from "@/components/LogoSection.vue";

  export default {
    name: "reset-password",
    components: {
      LogoSection,
    },
  }
</script>

<style>
  #app {
    color: red;
  }
  #app {
    --paper-color: rgb(247, 247, 247);
    --entry-field: rgb(146, 240, 105);
    --error-color: rgb(217, 111, 111);
    --section-color: rgb(219, 250, 255);
    --subsection-color: rgb(221, 219, 255);
    --grid-line-color: rgb(0, 0, 0);
    --box-border-color: rgb(0, 0, 0);
    --inapplicable-color: rgb(144, 144, 144);
    --lightbox-shade-color: rgba(0, 0, 0, 0.5);
    --under-development-color: rgb(255, 148, 77);
    --title-color: rgb(148, 9, 218);
    --status-color: rgb(247, 247, 17);
    font-family: sans-serif;
    font-size: small;
  }
</style>

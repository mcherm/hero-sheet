<template>
  <div>
    <div>
      This is the character summary
    </div>
    <div>
      strength = {{getCharsheet().abilities.strength.ranks}}
    </div>
  </div>
</template>

<script>
  export default {
    name: "CharacterSummary",
    inject: ["getCharsheet"],
  }
</script>

<style scoped>

</style>
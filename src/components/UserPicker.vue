<template>
  <boxed-section title="Enter Username" class="user-picker">
    <input v-model="currentUser" class="user-entry" @keyup.enter="$emit('change-user', currentUser)" />
    <button v-on:click="$emit('change-user', currentUser)">Set User</button>
  </boxed-section>
</template>

<script>
  export default {
    name: "UserPicker",
    props: {
      user: { type: String, required: true }
    },
    data: function() {
      return {
        currentUser: ""
      }
    },
    created: function() {
      this.currentUser = this.user;
    }
  }
</script>

<style scoped>
  .user-picker {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }
  .user-entry {
    font-size: inherit;
    margin: 3px;
  }
</style>

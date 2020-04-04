<template>
  <div>
    <boxed-section title="Returning Users" class="user-picker">
      <label>Enter Username</label>
      <input v-model="loginUser" @keyup.enter="attemptLogin()" />
      <label>Password</label>
      <input v-model="loginPassword"/>
      <button v-on:click="attemptLogin()">Log In</button>
    </boxed-section>
    <boxed-section title="New Users" class="user-creation">
      <label>Choose Username</label>
      <input v-model="newUser" class="user-entry" @keyup.enter="$emit('change-user', currentUser)" />
      <label>Email</label>
      <input v-model="newEmail"/>
      <label>Password</label>
      <input v-model="newPassword"/>
      <button>Create User</button>
    </boxed-section>
  </div>
</template>

<script>
  export default {
    name: "UserLogin",
    props: {
      user: { type: String, required: true }
    },
    data: function() {
      return {
        loginUser: "",
        loginPassword: "",
        newUser: "",
        newEmail: "",
        newPassword: ""
      }
    },
    created: function() {
      this.loginUser = this.user;
    },
    methods: {
      attemptLogin: async function() {
        console.log(`performing attemptLogin()`); // FIXME: Remove
        const body = {password: "pass"}; // FIXME: Real value here

        const url = `https://u3qr0bfjmc.execute-api.us-east-1.amazonaws.com/prod/hero-sheet/users/${this.user}/login`;
        const response = await fetch(url, {
          method: "POST",
          headers: { 'Content-Type': 'application/json' },
          credentials: "include", // Needed NOT because we are SENDING them, but in order to RECEIVE them. Several hours of debugging there.
          body: JSON.stringify(body)
        });
        if (response.status === 200) {
          const json = await response.json();
          console.log(`Login call returned this body: ${JSON.stringify(json)}`); // FIXME: Remove
        } else {
          // FIXME: Need to display the error to the user
          console.log("Failed to login", response);
        }

        this.$emit('change-user', this.loginUser);
      }
    }
  }
</script>

<style scoped>
  .user-picker {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }
  .boxed-section label {
    background-color: inherit;
    margin-top: 3px;
    margin-left: 3px;
  }
  input {
    font-size: inherit;
    margin: 3px;
  }
  button {
    margin: 3px;
  }
  .user-creation {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }
</style>

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
  import {login} from "../js/api.js";

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
        try {
          const loginResponse = await login(this.loginUser, this.loginPassword);
          if (loginResponse === "Success") {
            console.log(`Login successful. Will change user to ${this.loginUser}.`);
            // FIXME: Right now the following line isn't working
            this.$emit('change-user', this.loginUser);
          } else {
            // FIXME: Need to have actual UI response to this failure!
            console.log("Login was not successful. NEED TO TELL THE USER IT WAS WRONG.");
          }
        } catch(err) {
          // FIXME: Need to display the error to the user
          console.log("Failure when attempting to login.", response);
        }
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

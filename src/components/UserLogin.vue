<template>
  <div>
    <boxed-section title="Returning Users" class="user-picker">
      <label>Username or Email</label>
      <input v-model="loginUser"/>
      <label>Password</label>
      <input v-model="loginPassword" @keyup.enter="attemptLogin()"/>
      <button v-on:click="attemptLogin()">Log In</button>
    </boxed-section>
    <boxed-section title="New Users" class="user-creation">
      <div class="new-user-fields">
        <div>
          <label>Username</label>
          <input v-model="newUser" :pattern="allowedRegEx.user" class="user-entry"/>
        </div>
        <div class="explanation">A name you want to use for logging in. This is optional if
        you provide an email address instead.</div>
        <div>
          <label>Email</label>
          <input v-model="newEmail" :pattern="allowedRegEx.email"/>
        </div>
        <div class="explanation">An email address. Optional, but if you do not provide an email
        address then you will be completely anonymous -- there will be no way to restore access
        if you lose your password and you will definitely not be warned if accounts need to be
        deleted. We will NOT sell or send spam to your email.</div>
        <div>
          <label>Password</label>
          <input v-model="newPassword" :pattern="allowedRegEx.password" @keyup.enter="attemptLogin()"/>
        </div>
        <div class="explanation">A password to log into your account.</div>
      </div>
      <button v-on:click="attemptCreateUser()">Create User</button>
    </boxed-section>
  </div>
</template>

<script>
  import {login, createUser} from "../js/api.js";

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
        newPassword: "",
        allowedRegEx: {
          user: "^|[a-zA-Z0-9$@._+-]+$",
          email: "^|[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
          password: "^.{4,}$"
        }
      }
    },
    created: function() {
      this.loginUser = this.user;
    },
    methods: {
      attemptLogin: async function() {
        try {
          const loginResponse = await login(this.loginUser, this.loginPassword);
          if (loginResponse === "Success") {
            console.log(`Login successful. Will change user to ${this.loginUser}.`); // FIXME: Remove
            this.$emit('change-user', this.loginUser);
          } else {
            // FIXME: Need to have actual UI response to this failure!
            console.log("Login was not successful. NEED TO TELL THE USER IT WAS WRONG.");
          }
        } catch(err) {
          // FIXME: Need to display the error to the user
          console.log("Failure when attempting to login.", err);
        }
      },
      validateUserCreateFields: function() {
        if(true) return true; // FIXME: Remove this
        const fieldsValid = (
          new RegExp(this.allowedRegEx.user).test(this.newUser) &&
          new RegExp(this.allowedRegEx.email).test(this.newEmail) &&
          new RegExp(this.allowedRegEx.password).test(this.newPassword)
        );
        const hasUserOrEmail = this.newUser !== "" || this.newEmail !== "";
        const onlyEmailsHaveAt = this.newUser === this.newEmail || !this.newUser.includes("@");
        return fieldsValid && hasUserOrEmail && onlyEmailsHaveAt;
      },
      attemptCreateUser: async function() {
        if (!this.validateUserCreateFields()) {
          // FIXME: Need to display the error to the user
          console.log("Fields are invalid.");
          return;
        }
        try {
          const createUserResponse = await createUser(this.newUser, this.newEmail, this.newPassword);
          if (createUserResponse === "Success") {
            console.log(`create user successful. Will change user to ${this.newUser}.`); // FIXME: Remove
            this.$emit('change-user', this.newUser);
          } else {
            // FIXME: Need to have actual UI response to this failure!
            console.log("Create User was not successful. NEED TO TELL THE USER IT FAILED.");
          }
        } catch(err) {
          // FIXME: Need to display the error to the user
          console.log("Failure when attempting to create a new user.", err);
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
  div.new-user-fields {
    display: grid;
    grid-template-columns: max-content auto;
    gap: 5px;
    align-items: center;
    background-color: inherit;
    max-width: 780px;
  }
  .new-user-fields div {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }
  .explanation {
    font-style: italic;
    align-self: end;
    margin-bottom: 3px;
  }
  .user-creation input {
    background-color: var(--paper-color);
  }
</style>

<template>
  <div>
    <boxed-section title="Returning Users" class="user-picker">
      <label>Username or Email</label>
      <input v-model="loginUserOrEmail"/>
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
        you provide an email address.</div>
        <div>
          <label>Email</label>
          <input v-model="newEmail" :pattern="allowedRegEx.email"/>
        </div>
        <div class="explanation">An email address. Optional, but if you do not provide an email
        address then you will be completely anonymous -- there will be no way to restore access
        if you lose your password and you will definitely not be warned if action is needed to
        preserve your data. We will NOT sell your email or send spam to it.</div>
        <div>
          <label>Password</label>
          <input v-model="newPassword" :pattern="allowedRegEx.password" @keyup.enter="attemptLogin()"/>
        </div>
        <div class="explanation">A password to log into your account (minimum length 4).</div>
      </div>
      <button v-on:click="attemptCreateUser()" :disabled="!userCreateFieldsAreValid">Create User</button>
    </boxed-section>
  </div>
</template>

<script>
  import {NotLoggedInError, login, createUser} from "../js/api.js";
  import {fieldAllowedRegEx} from "../js/heroSheetUtil.js";

  export default {
    name: "UserLogin",
    props: {
      prefillUser: { type: String, required: true }
    },
    data: function() {
      return {
        loginUserOrEmail: "",
        loginPassword: "",
        newUser: "",
        newEmail: "",
        newPassword: "",
        allowedRegEx: fieldAllowedRegEx
      }
    },
    created: function() {
      this.loginUserOrEmail = this.prefillUser;
    },
    computed: {
      userCreateFieldsAreValid: function() {
        const fieldsValid = (
            new RegExp(this.allowedRegEx.user).test(this.newUser) &&
            new RegExp(this.allowedRegEx.email).test(this.newEmail) &&
            new RegExp(this.allowedRegEx.password).test(this.newPassword)
        );
        const hasUserOrEmail = this.newUser !== "" || this.newEmail !== "";
        const onlyEmailsHaveAt = this.newUser === this.newEmail || !this.newUser.includes("@");
        return fieldsValid && hasUserOrEmail && onlyEmailsHaveAt;
      }
    },
    methods: {
      attemptLogin: async function() {
        try {
          const loginResponse = await login(this.loginUserOrEmail, this.loginPassword);
          if (loginResponse.loggedIn === true) {
            const user = loginResponse.user;
            console.log(`Login successful. Will change user to ${user}.`); // FIXME: Remove
            this.$emit('change-user', user);
          } else {
            // FIXME: Need to have actual UI response to this failure!
            console.log("Login was not successful. NEED TO TELL THE USER IT WAS WRONG.");
          }
        } catch(err) {
          if (err instanceof NotLoggedInError) {
            // FIXME: Need to display the error to the user
            console.log("Login Failed.");
          } else {
            // FIXME: Need to display the error to the user
            console.log("Failure when attempting to login.", err);
          }
        }
      },
      attemptCreateUser: async function() {
        if (!this.userCreateFieldsAreValid) {
          // FIXME: Need to display the error to the user
          console.log("Fields are invalid.");
          return;
        }
        try {
          const createUserResponse = await createUser(this.newUser, this.newEmail, this.newPassword);

          if (createUserResponse.loggedIn === true) {
            const user = createUserResponse.user;
            console.log(`create user successful. Will change user to ${user}.`); // FIXME: Remove
            this.$emit('change-user', user);
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

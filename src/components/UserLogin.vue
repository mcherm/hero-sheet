<template>
  <div>
    <boxed-section title="Returning Users" class="user-picker">
      <label>Username or Email</label>
      <input v-model="loginUserOrEmail"/>
      <label>Password</label>
      <input v-model="loginPassword" @keyup.enter="attemptLogin()"/>
      <button v-on:click="attemptLogin()" :disabled="!loginFieldsAreValid">Log In</button>
      <collapsing-section class="ten-px-top-margin" title="Forgot Password">
        <div class="forgot-password-form">
          <div class="forgot-password-note">You can request an email with a link to reset your password.</div>
          <label>Email</label>
          <input v-model="emailForResetPassword" :pattern="allowedRegEx.email">
          <button :disabled="!forgotPasswordFieldsAreValid" @click="requestPasswordReset">Send Email</button>
        </div>
      </collapsing-section>
    </boxed-section>
    <boxed-section title="New Users" class="user-creation">
      <div class="new-user-fields">
        <div>
          <label>Username</label>
          <input v-model="newUser" :pattern="allowedRegEx.user" class="user-entry"/>
        </div>
        <div class="explanation">
          The name that will be displayed in the application. Leave blank just use your
          email address as a username.
        </div>
        <div>
          <label>Email</label>
          <input v-model="newEmail" :pattern="allowedRegEx.email"/>
        </div>
        <div class="explanation">
          Your email address. You can leave this blank to be completely anonymous, but
          if you do so then there will be no way to reset your password nor any way for
          the site to communicate with you if action is needed to preserve your data.
          We will NOT sell your email or send spam to it.
        </div>
        <div>
          <label>Password</label>
          <input v-model="newPassword" :pattern="allowedRegEx.password" @keyup.enter="attemptLogin()"/>
        </div>
        <div class="explanation">
          A password to log into your account (minimum length 4).
        </div>
      </div>
      <button v-on:click="attemptCreateUser()" :disabled="!userCreateFieldsAreValid">Create User</button>
    </boxed-section>
  </div>
</template>

<script>
  import {NotLoggedInError, login, createUser, requestPasswordReset} from "../js/api.js";
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
        allowedRegEx: fieldAllowedRegEx,
        emailForResetPassword: "",
      }
    },
    created: function() {
      this.loginUserOrEmail = this.prefillUser;
    },
    computed: {
      loginFieldsAreValid: function() {
        return this.loginUserOrEmail !== "" && this.loginPassword !== "";
      },
      userCreateFieldsAreValid: function() {
        const fieldsValid = (
            new RegExp(this.allowedRegEx.user).test(this.newUser) &&
            new RegExp(this.allowedRegEx.email).test(this.newEmail) &&
            new RegExp(this.allowedRegEx.password).test(this.newPassword)
        );
        const hasUserOrEmail = this.newUser !== "" || this.newEmail !== "";
        const onlyEmailsHaveAt = this.newUser === this.newEmail || !this.newUser.includes("@");
        return fieldsValid && hasUserOrEmail && onlyEmailsHaveAt;
      },
      forgotPasswordFieldsAreValid: function() {
        return this.emailForResetPassword !== "" &&
            new RegExp(this.allowedRegEx.email).test(this.emailForResetPassword);
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
      },
      requestPasswordReset: async function() {
        const passwordResetResponse = await requestPasswordReset(this.emailForResetPassword);
        this.emailForResetPassword = "";
        // FIXME: Should probably provide some indicator to the user that it worked
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
  .ten-px-top-margin {
    margin-top: 10px;
  }
  .forgot-password-form {
    display: flex;
    flex-flow: column;
    align-items: flex-start;
  }
  .forgot-password-note {
    margin-bottom: 5px;
  }
</style>

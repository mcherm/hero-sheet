<template>
  <div>
    <boxed-section title="Returning Users" class="user-picker">
      <label>Username or Email</label>
      <input v-model="loginUserOrEmail"/>
      <label>Password</label>
      <input type="password" v-model="loginPassword" @keyup.enter="attemptLogin()"/>
      <edit-button :onClick="attemptLogin" :disabled="!loginFieldsAreValid" class="button">Log In</edit-button>
      <collapsing-section class="ten-px-top-margin" title="Forgot Password">
        <div class="forgot-password-form">
          <div class="forgot-password-note">You can request an email with a link to reset your password.</div>
          <label>Email</label>
          <input v-model="emailForResetPassword" :pattern="allowedRegEx.email">
          <edit-button :disabled="!forgotPasswordFieldsAreValid" :onClick="requestPasswordReset">Send Email</edit-button>
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
          <input type="password" v-model="newPassword" :pattern="allowedRegEx.password" @keyup.enter="attemptLogin()"/>
        </div>
        <div class="explanation">
          A password to log into your account (minimum length 4).
        </div>
      </div>
      <edit-button :onClick="attemptCreateUser" :disabled="!userCreateFieldsAreValid" class="button">Create User</edit-button>
    </boxed-section>
  </div>
</template>

<script>
  import {NotLoggedInError, login, createUser, requestPasswordReset} from "../js/api.js";
  import {showAlert} from "../js/heroSheetUtil.js";
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
            this.$emit('change-user', user);
          } else {
            showAlert({message: "Login Failed", lifetime: "long"});
          }
        } catch(err) {
          if (err instanceof NotLoggedInError) {
            showAlert({message: "Login Failed", lifetime: "long"});
          } else {
            showAlert({message: "Login Failed for Unknown Reason", lifetime: "long"});
          }
        }
      },
      attemptCreateUser: async function() {
        if (!this.userCreateFieldsAreValid) {
          showAlert({message: "Invalid Values for New User", lifetime: "short"});
          return;
        }
        try {
          const createUserResponse = await createUser(this.newUser, this.newEmail, this.newPassword);

          if (createUserResponse.loggedIn === true) {
            const user = createUserResponse.user;
            this.$emit('change-user', user);
          } else {
            showAlert({message: "Create user was not successful.", lifetime: "long"});
          }
        } catch(err) {
          showAlert({message: "Failure when attempting to create a new user.", lifetime: "long"});
        }
      },
      requestPasswordReset: async function() {
        const passwordResetResponse = await requestPasswordReset(this.emailForResetPassword);
        this.emailForResetPassword = "";
        showAlert({message: "Password reset will be sent by email.", lifetime: "manual", format: "info"});
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
  button.button {
    background-color: var(--button-color);
  }
</style>

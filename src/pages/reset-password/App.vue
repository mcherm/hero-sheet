<template>
  <div id="app">
    <logo-section/>
    <header-section
        title-if-logged-out="Reset Password"
        character-name=""
        :character-selected="false"
        user=""
        :user-selected="false"
    />
    <boxed-section title="Reset Password" class="password-reset-form">
      <label>Username or Email</label>
      <input v-model="userOrEmail"/>
      <label>New Password</label>
      <input v-model="newPassword" @keyup.enter="changePassword()"/>
      <button v-on:click="changePassword()">Reset Password</button>
    </boxed-section>
  </div>
</template>

<script>
  import Vue from 'vue';
  import LogoSection from "@/components/LogoSection.vue";
  import HeaderSection from "@/components/HeaderSection";

  // Create a global "$globals" available on all vue instances. (NOT reactive).
  const globals = {
    eventBus: new Vue({}),
    developerMode: false,
    deployment: "prod",
  };
  Vue.prototype.$globals = globals;

  export default {
    name: "reset-password",
    components: {
      LogoSection,
      HeaderSection,
    },
    data: function() {
      return {
        userOrEmail: "need-to-populate-this-from-url",
        newPassword: "",
      };
    },
    methods: {
      changePassword: function() {
        console.log(`I will now change the password to '${this.newPassword}'.`); // FIXME: Write real code
      }
    }
  }
</script>

<style>
  .password-reset-form {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }
  .boxed-section.password-reset-form label {
    background-color: var(--section-color);
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
</style>

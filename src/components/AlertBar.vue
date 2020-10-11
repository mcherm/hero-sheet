<!--
  Displays a bar across the screen with an alert (often error, sometimes info). It can be dismissed
  manually and most will go away after a short or long time.
-->
<template>
  <div>
    <div v-for="alert of alertList">
      <div class="alert-item" :class="alert.format">
        <div class="message">{{alert.format.toUpperCase()}}: {{alert.message}}</div>
        <div class="close" @click="onClose(alert.hsid)">
          <close-icon/>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  import CloseIcon from "@/components/CloseIcon.vue";

  export default {
    name: "AlertBar",
    components: {
      CloseIcon
    },
    props: {
      alertList: { type: Array, required: true },
    },
    methods: {
      onClose: function(alertHsid) {
        this.$globals.eventBus.$emit("clear-alert", alertHsid);
      }
    }
  }
</script>

<style scoped>
  .alert-item {
    border: 1px solid;
    padding: 3px;
    display: flex;
    justify-content: center;
    margin-top: 2px;
    margin-bottom: 2px;
    position: relative;
    top: 0;
    left: 0;
  }
  .alert-item.error {
    background-color: var(--error-color);
  }
  .alert-item.info {
    background-color: rgb(111, 217, 111);
  }
  .message {
    font-weight: bold;
  }
  .close {
    position: absolute;
    top: 2px;
    right: 2px;
  }
</style>

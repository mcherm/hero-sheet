<!--
  This is a reusable vue component that creates a "tabs" view so the
  user can toggle between several different bits of content.

  It is used like this:
    <tab-display>
      <template slot="tab 1">
        First Tab Contents
      </template>
      <template slot="tab 2">
        <some-other-component/>
      </template>
    </tab-display>
-->
<template>
  <div class="tab-area">
    <nav class="tab-selectors">
      <button
          v-for="tab in tabs"
          class="tab-selector"
          v-bind:class="['tab-button', { active: currentTab === tab }]"
          v-on:click="currentTab = tab"
      >{{tab}}</button>
    </nav>
    <div class="tab-frame">
      <slot v-bind:name="currentTab"></slot>
    </div>
  </div>
</template>

<script>
  export default {
    name: "TabDisplay",
    data: function() {
      return {
        currentTab: Object.keys(this.$slots)[0],
        tabs: Object.keys(this.$slots)
      }
    }
  }
</script>

<style scoped>
  .tab-area {
    --inactive-border-color: var(--inapplicable-color);
    --inactive-background-color: var(--inapplicable-color);
    --inactive-text-color: rgb(250, 250, 250);
    --active-text-color: rgb(0, 0, 0);
    --hover-background-color: rgb(0, 0, 0);
    --hover-text-color: rgb(255, 255, 255);
  }
  .tab-selectors ol {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  .tab-selector {
    display: inline;
    padding: 3px 3px;
    border-top-left-radius: 6px;
    border-top-right-radius: 6px;
    margin-right: 3px;
    cursor: pointer;
    border-style: solid solid hidden solid;
    border-width: 2px;
    border-color: var(--inactive-border-color);
    background: var(--inactive-background-color);
    color: var(--inactive-text-color);
    margin-bottom: -2px;
    text-transform: capitalize;
  }
  .tab-selector:hover {
    border-color: var(--box-border-color);
    background: var(--hover-background-color);
    color: var(--hover-text-color);
  }
  .tab-selector.active {
    border-color: var(--box-border-color);
    background: var(--paper-color);
    color: var(--active-text-color);
  }
  .tab-frame {
    border: 2px solid var(--box-border-color);
    padding: 10px;
    background-color: var(--paper-color);
  }
</style>

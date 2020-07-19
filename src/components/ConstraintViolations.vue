<template>
  <boxed-section title="Constraint Violations">
    <div class="constraint-violation-list grid-with-lines">
      <div class="col-label">Violation</div>
      <div class="col-label">GM Approved</div>
      <div
        class="display-contents"
        v-for="(constraint, constraintKey) in getCharsheet().constraintViolations"
        :key="constraintKey"
      >
        <div class="grid-with-lines-cell">Some Constraint Violation: {{constraintKey}}</div>
        <yes-no-toggle v-model="constraint.gmApproval"/>
      </div>
      <div class="empty-notice" v-if="Object.keys(getCharsheet().constraintViolations).length === 0">Everything is within the campaign power level.</div>
    </div>
  </boxed-section>
</template>

<script>
  export default {
    name: "ConstraintViolations",
    inject: ["getCharsheet"],
  }
</script>

<style scoped>
  .constraint-violation-list {
    display: inline grid;
    grid-template-columns: max-content max-content;
    justify-items: stretch;
  }
</style>

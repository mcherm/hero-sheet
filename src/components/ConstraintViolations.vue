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
        <div class="grid-with-lines-cell">{{constraintDescription(constraintKey)}}</div>
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
    methods: {
      constraintDescription: function(constraintKey) {
        if (constraintKey === "DodgeAndToughness") {
          return `Dodge + Toughness is more than 2 * Power Level.`;
        }
        if (constraintKey === "ParryAndToughness") {
          return `Parry + Toughness is more than 2 * Power Level.`;
        }
        if (constraintKey === "FortitudeAndWill") {
          return `Fortitude + Will is more than 2 * Power Level.`;
        }
        const attackMatch = /^AttackRoll@(HI[A-Z0-9]{7})$/.exec(constraintKey);
        if (attackMatch) {
          const attackName = this.getCharsheet().attacks.attackList.find(x => x.hsid === attackMatch[1]).name;
          return `Attack bonus plus rank is more than 2 * Power Level for ${attackName}.`;
        }
        const normalSkillMatch = /^NormalSkillLimit@([a-z]+)$/.exec(constraintKey);
        if (normalSkillMatch) {
          return `Skill roll is more than 10 + Power Level for ${normalSkillMatch[1]}.`;
        }
        const templateSkillMatch = /^TemplateSkillLimit@(HI[A-Z0-9]{7})$/.exec(constraintKey);
        if (templateSkillMatch) {
          const skillName = this.getCharsheet().skills.skillList.find(x => x.hsid === templateSkillMatch[1]).name;
          return `Skill roll is more than 10 + Power Level for ${skillName}.`;
        }
        throw new Error(`Unsupported constraint.`);
      }
    }
  }
</script>

<style scoped>
  .constraint-violation-list {
    display: inline grid;
    grid-template-columns: max-content max-content;
    justify-items: stretch;
  }
</style>

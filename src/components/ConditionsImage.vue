<!-- WARNING: Generated Code... Do Not Modify! -->
<!-- See tools/diagram_builder/build_diagram.py instead. -->
<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    id="conditions"
    viewBox="0 0 520 380"
  >
  <defs>
    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
      <polygon points="0 0, 10 3.5, 0 7" />
    </marker>
  </defs>
  <g>
            <rect id="bar0" class="colorBar"
               x="0" y="0"
               width="520" height="60"
            />
            <rect id="bar1" class="colorBar"
               x="0" y="60"
               width="520" height="60"
            />
            <rect id="bar2" class="colorBar"
               x="0" y="120"
               width="520" height="100"
            />
            <rect id="bar3" class="colorBar"
               x="0" y="220"
               width="520" height="100"
            />
            <rect id="bar4" class="colorBar"
               x="0" y="320"
               width="520" height="60"
            />
            <line x1="85" y1="104" x2="85" y2="126" class="connector" marker-end="url(#arrowhead)"/>
            <line x1="165" y1="104" x2="165" y2="126" class="connector" marker-end="url(#arrowhead)"/>
            <line x1="245" y1="104" x2="245" y2="126" class="connector" marker-end="url(#arrowhead)"/>
            <line x1="325" y1="104" x2="325" y2="126" class="connector" marker-end="url(#arrowhead)"/>
            <line x1="405" y1="104" x2="405" y2="126" class="connector" marker-end="url(#arrowhead)"/>
            <line x1="365" y1="204" x2="365" y2="226" class="connector" marker-end="url(#arrowhead)"/>
            <line x1="485" y1="164" x2="485" y2="226" class="connector" marker-end="url(#arrowhead)"/>
            <line x1="285" y1="204" x2="285" y2="266" class="connector" marker-end="url(#arrowhead)"/>
            <line x1="325" y1="164" x2="325" y2="228" class="connector" />
            <line x1="325" y1="228" x2="285" y2="228" class="connector" />
            <line x1="165" y1="264" x2="205" y2="276" class="connector" />
            <line x1="245" y1="264" x2="205" y2="276" class="connector" />
            <g id="condition_normal" class="condition" :class="conditions.normal" @click="onClickCondition('normal')">
                <rect class="conditionBorder"
                    x="240" y="16"
                    width="50" height="28"
                    rx="7" ry="7"
                />
                <rect class="conditionBox"
                    x="242" y="18"
                    width="46" height="24"
                    rx="5" ry="5"
                />
                <text class="conditionName"
                    x="265" y="30"
                >Normal</text>
                <text class="conditionDesc"
                    x="265" y="37"
                >No Conditions</text>
            </g>
            <g id="condition_dazed" class="condition" :class="conditions.dazed" @click="onClickCondition('dazed')">
                <rect class="conditionBorder"
                    x="60" y="76"
                    width="50" height="28"
                    rx="7" ry="7"
                />
                <rect class="conditionBox"
                    x="62" y="78"
                    width="46" height="24"
                    rx="5" ry="5"
                />
                <text class="conditionName"
                    x="85" y="90"
                >Dazed</text>
                <text class="conditionDesc"
                    x="85" y="97"
                >Single Action</text>
            </g>
            <g id="condition_hindered" class="condition" :class="conditions.hindered" @click="onClickCondition('hindered')">
                <rect class="conditionBorder"
                    x="140" y="76"
                    width="50" height="28"
                    rx="7" ry="7"
                />
                <rect class="conditionBox"
                    x="142" y="78"
                    width="46" height="24"
                    rx="5" ry="5"
                />
                <text class="conditionName"
                    x="165" y="90"
                >Hindered</text>
                <text class="conditionDesc"
                    x="165" y="97"
                >Half Move</text>
            </g>
            <g id="condition_vulnerable" class="condition" :class="conditions.vulnerable" @click="onClickCondition('vulnerable')">
                <rect class="conditionBorder"
                    x="220" y="76"
                    width="50" height="28"
                    rx="7" ry="7"
                />
                <rect class="conditionBox"
                    x="222" y="78"
                    width="46" height="24"
                    rx="5" ry="5"
                />
                <text class="conditionName"
                    x="245" y="90"
                >Vulnerable</text>
                <text class="conditionDesc"
                    x="245" y="97"
                >Half Active Def</text>
            </g>
            <g id="condition_impaired" class="condition" :class="conditions.impaired" @click="onClickCondition('impaired')">
                <rect class="conditionBorder"
                    x="300" y="76"
                    width="50" height="28"
                    rx="7" ry="7"
                />
                <rect class="conditionBox"
                    x="302" y="78"
                    width="46" height="24"
                    rx="5" ry="5"
                />
                <text class="conditionName"
                    x="325" y="90"
                >Impaired(stat)</text>
                <text class="conditionDesc"
                    x="325" y="97"
                >-1 on checks</text>
            </g>
            <g id="condition_fatigued" class="condition" :class="conditions.fatigued" @click="onClickCondition('fatigued')">
                <rect class="conditionBorder"
                    x="380" y="76"
                    width="50" height="28"
                    
                />
                <rect class="conditionBox"
                    x="382" y="78"
                    width="46" height="24"
                    
                />
                <text class="conditionName"
                    x="405" y="90"
                >Fatigued</text>
                <text class="conditionDesc"
                    x="405" y="97"
                >-1 on checks</text>
            </g>
            <g id="condition_staggered" class="condition" :class="conditions.staggered" @click="onClickCondition('staggered')">
                <rect class="conditionBorder"
                    x="20" y="176"
                    width="50" height="28"
                    
                />
                <rect class="conditionBox"
                    x="22" y="178"
                    width="46" height="24"
                    
                />
                <text class="conditionName"
                    x="45" y="190"
                >Staggered</text>
                <text class="conditionDesc"
                    x="45" y="197"
                ></text>
            </g>
            <g id="condition_stunned" class="condition" :class="conditions.stunned" @click="onClickCondition('stunned')">
                <rect class="conditionBorder"
                    x="60" y="136"
                    width="50" height="28"
                    rx="7" ry="7"
                />
                <rect class="conditionBox"
                    x="62" y="138"
                    width="46" height="24"
                    rx="5" ry="5"
                />
                <text class="conditionName"
                    x="85" y="150"
                >Stunned</text>
                <text class="conditionDesc"
                    x="85" y="157"
                >No Actions</text>
            </g>
            <g id="condition_prone" class="condition" :class="conditions.prone" @click="onClickCondition('prone')">
                <rect class="conditionBorder"
                    x="100" y="176"
                    width="50" height="28"
                    rx="7" ry="7"
                />
                <rect class="conditionBox"
                    x="102" y="178"
                    width="46" height="24"
                    rx="5" ry="5"
                />
                <text class="conditionName"
                    x="125" y="190"
                >Prone</text>
                <text class="conditionDesc"
                    x="125" y="197"
                >+/-5 attacks</text>
            </g>
            <g id="condition_immobile" class="condition" :class="conditions.immobile" @click="onClickCondition('immobile')">
                <rect class="conditionBorder"
                    x="140" y="136"
                    width="50" height="28"
                    rx="7" ry="7"
                />
                <rect class="conditionBox"
                    x="142" y="138"
                    width="46" height="24"
                    rx="5" ry="5"
                />
                <text class="conditionName"
                    x="165" y="150"
                >Immobile</text>
                <text class="conditionDesc"
                    x="165" y="157"
                >No Move</text>
            </g>
            <g id="condition_surprised" class="condition" :class="conditions.surprised" @click="onClickCondition('surprised')">
                <rect class="conditionBorder"
                    x="180" y="176"
                    width="50" height="28"
                    
                />
                <rect class="conditionBox"
                    x="182" y="178"
                    width="46" height="24"
                    
                />
                <text class="conditionName"
                    x="205" y="190"
                >Surprised</text>
                <text class="conditionDesc"
                    x="205" y="197"
                ></text>
            </g>
            <g id="condition_defenseless" class="condition" :class="conditions.defenseless" @click="onClickCondition('defenseless')">
                <rect class="conditionBorder"
                    x="220" y="136"
                    width="50" height="28"
                    rx="7" ry="7"
                />
                <rect class="conditionBox"
                    x="222" y="138"
                    width="46" height="24"
                    rx="5" ry="5"
                />
                <text class="conditionName"
                    x="245" y="150"
                >Defenseless</text>
                <text class="conditionDesc"
                    x="245" y="157"
                >Active Def = 0</text>
            </g>
            <g id="condition_weakened" class="condition" :class="conditions.weakened" @click="onClickCondition('weakened')">
                <rect class="conditionBorder"
                    x="260" y="176"
                    width="50" height="28"
                    rx="7" ry="7"
                />
                <rect class="conditionBox"
                    x="262" y="178"
                    width="46" height="24"
                    rx="5" ry="5"
                />
                <text class="conditionName"
                    x="285" y="190"
                >Weakened(pwr)</text>
                <text class="conditionDesc"
                    x="285" y="197"
                >-X on power/stat</text>
            </g>
            <g id="condition_disabled" class="condition" :class="conditions.disabled" @click="onClickCondition('disabled')">
                <rect class="conditionBorder"
                    x="300" y="136"
                    width="50" height="28"
                    rx="7" ry="7"
                />
                <rect class="conditionBox"
                    x="302" y="138"
                    width="46" height="24"
                    rx="5" ry="5"
                />
                <text class="conditionName"
                    x="325" y="150"
                >Disabled(stat)</text>
                <text class="conditionDesc"
                    x="325" y="157"
                >-5 on checks</text>
            </g>
            <g id="condition_compelled" class="condition" :class="conditions.compelled" @click="onClickCondition('compelled')">
                <rect class="conditionBorder"
                    x="340" y="176"
                    width="50" height="28"
                    rx="7" ry="7"
                />
                <rect class="conditionBox"
                    x="342" y="178"
                    width="46" height="24"
                    rx="5" ry="5"
                />
                <text class="conditionName"
                    x="365" y="190"
                >Compelled</text>
                <text class="conditionDesc"
                    x="365" y="197"
                >1 forced action</text>
            </g>
            <g id="condition_exhausted" class="condition" :class="conditions.exhausted" @click="onClickCondition('exhausted')">
                <rect class="conditionBorder"
                    x="380" y="136"
                    width="50" height="28"
                    
                />
                <rect class="conditionBox"
                    x="382" y="138"
                    width="46" height="24"
                    
                />
                <text class="conditionName"
                    x="405" y="150"
                >Exhausted</text>
                <text class="conditionDesc"
                    x="405" y="157"
                ></text>
            </g>
            <g id="condition_entranced" class="condition" :class="conditions.entranced" @click="onClickCondition('entranced')">
                <rect class="conditionBorder"
                    x="420" y="176"
                    width="50" height="28"
                    
                />
                <rect class="conditionBox"
                    x="422" y="178"
                    width="46" height="24"
                    
                />
                <text class="conditionName"
                    x="445" y="190"
                >Entranced</text>
                <text class="conditionDesc"
                    x="445" y="197"
                ></text>
            </g>
            <g id="condition_restrained" class="condition" :class="conditions.restrained" @click="onClickCondition('restrained')">
                <rect class="conditionBorder"
                    x="460" y="136"
                    width="50" height="28"
                    
                />
                <rect class="conditionBox"
                    x="462" y="138"
                    width="46" height="24"
                    
                />
                <text class="conditionName"
                    x="485" y="150"
                >Restrained</text>
                <text class="conditionDesc"
                    x="485" y="157"
                ></text>
            </g>
            <g id="condition_incapacitated" class="condition" :class="conditions.incapacitated" @click="onClickCondition('incapacitated')">
                <rect class="conditionBorder"
                    x="20" y="276"
                    width="50" height="28"
                    
                />
                <rect class="conditionBox"
                    x="22" y="278"
                    width="46" height="24"
                    
                />
                <text class="conditionName"
                    x="45" y="290"
                >Incapacitated</text>
                <text class="conditionDesc"
                    x="45" y="297"
                ></text>
            </g>
            <g id="condition_asleep" class="condition" :class="conditions.asleep" @click="onClickCondition('asleep')">
                <rect class="conditionBorder"
                    x="60" y="236"
                    width="50" height="28"
                    
                />
                <rect class="conditionBox"
                    x="62" y="238"
                    width="46" height="24"
                    
                />
                <text class="conditionName"
                    x="85" y="250"
                >Asleep</text>
                <text class="conditionDesc"
                    x="85" y="257"
                ></text>
            </g>
            <g id="condition_paralyzed" class="condition" :class="conditions.paralyzed" @click="onClickCondition('paralyzed')">
                <rect class="conditionBorder"
                    x="100" y="276"
                    width="50" height="28"
                    
                />
                <rect class="conditionBox"
                    x="102" y="278"
                    width="46" height="24"
                    
                />
                <text class="conditionName"
                    x="125" y="290"
                >Paralyzed</text>
                <text class="conditionDesc"
                    x="125" y="297"
                ></text>
            </g>
            <g id="condition_blind" class="condition" :class="conditions.blind" @click="onClickCondition('blind')">
                <rect class="conditionBorder"
                    x="140" y="236"
                    width="50" height="28"
                    
                />
                <rect class="conditionBox"
                    x="142" y="238"
                    width="46" height="24"
                    
                />
                <text class="conditionName"
                    x="165" y="250"
                >Blind</text>
                <text class="conditionDesc"
                    x="165" y="257"
                ></text>
            </g>
            <g id="condition_unaware" class="condition" :class="conditions.unaware" @click="onClickCondition('unaware')">
                <rect class="conditionBorder"
                    x="180" y="276"
                    width="50" height="28"
                    rx="7" ry="7"
                />
                <rect class="conditionBox"
                    x="182" y="278"
                    width="46" height="24"
                    rx="5" ry="5"
                />
                <text class="conditionName"
                    x="205" y="290"
                >Unaware(sense)</text>
                <text class="conditionDesc"
                    x="205" y="297"
                >Can't Perceive</text>
            </g>
            <g id="condition_deaf" class="condition" :class="conditions.deaf" @click="onClickCondition('deaf')">
                <rect class="conditionBorder"
                    x="220" y="236"
                    width="50" height="28"
                    
                />
                <rect class="conditionBox"
                    x="222" y="238"
                    width="46" height="24"
                    
                />
                <text class="conditionName"
                    x="245" y="250"
                >Deaf</text>
                <text class="conditionDesc"
                    x="245" y="257"
                ></text>
            </g>
            <g id="condition_debilitated" class="condition" :class="conditions.debilitated" @click="onClickCondition('debilitated')">
                <rect class="conditionBorder"
                    x="260" y="276"
                    width="50" height="28"
                    rx="7" ry="7"
                />
                <rect class="conditionBox"
                    x="262" y="278"
                    width="46" height="24"
                    rx="5" ry="5"
                />
                <text class="conditionName"
                    x="285" y="290"
                >Debilitated(stat)</text>
                <text class="conditionDesc"
                    x="285" y="297"
                >Varies by Stat</text>
            </g>
            <g id="condition_controlled" class="condition" :class="conditions.controlled" @click="onClickCondition('controlled')">
                <rect class="conditionBorder"
                    x="340" y="236"
                    width="50" height="28"
                    rx="7" ry="7"
                />
                <rect class="conditionBox"
                    x="342" y="238"
                    width="46" height="24"
                    rx="5" ry="5"
                />
                <text class="conditionName"
                    x="365" y="250"
                >Controlled</text>
                <text class="conditionDesc"
                    x="365" y="257"
                >Forced actions</text>
            </g>
            <g id="condition_transformed" class="condition" :class="conditions.transformed" @click="onClickCondition('transformed')">
                <rect class="conditionBorder"
                    x="380" y="276"
                    width="50" height="28"
                    rx="7" ry="7"
                />
                <rect class="conditionBox"
                    x="382" y="278"
                    width="46" height="24"
                    rx="5" ry="5"
                />
                <text class="conditionName"
                    x="405" y="290"
                >Transformed</text>
                <text class="conditionDesc"
                    x="405" y="297"
                >Alternate Form</text>
            </g>
            <g id="condition_bound" class="condition" :class="conditions.bound" @click="onClickCondition('bound')">
                <rect class="conditionBorder"
                    x="460" y="236"
                    width="50" height="28"
                    
                />
                <rect class="conditionBox"
                    x="462" y="238"
                    width="46" height="24"
                    
                />
                <text class="conditionName"
                    x="485" y="250"
                >Bound</text>
                <text class="conditionDesc"
                    x="485" y="257"
                ></text>
            </g>
            <g id="condition_dying" class="condition" :class="conditions.dying" @click="onClickCondition('dying')">
                <rect class="conditionBorder"
                    x="240" y="336"
                    width="50" height="28"
                    rx="7" ry="7"
                />
                <rect class="conditionBox"
                    x="242" y="338"
                    width="46" height="24"
                    rx="5" ry="5"
                />
                <text class="conditionName"
                    x="265" y="350"
                >Dying</text>
                <text class="conditionDesc"
                    x="265" y="357"
                >Fort Checks</text>
            </g>
  </g>
</svg>
</template>

<script>
  const conditionsData = require("../data/conditionsData.json");
  const invertConditionLink = function(linkList) {
    const result = {};
    for (const condition in conditionsData.conditions) {
      result[condition] = [];
    }
    for (const condition in conditionsData.conditions) {
      for (const affectedCondition of conditionsData.conditions[condition][linkList]) {
        result[affectedCondition].push(condition);
      }
    }
    return result;
  };
  const triggeredBy = invertConditionLink("triggers");
  const supersededBy = invertConditionLink("supersedes");

  export default {
    name: "ConditionsImage.vue",
    inject: ["getCharsheet", "editModes"],
    data: function() {
      return {
        conditions: this.getCharsheet().status.conditions,
      }
    },
    methods: {
      someAncestorTriggersThis: function(condition) {
        for (const trigger of triggeredBy[condition]) {
          if (this.conditions[trigger].selected || this.someAncestorTriggersThis(trigger)) {
            return true;
          }
        }
        return false;
      },
      someAncestorSupersedesThis: function(condition) {
        for (const superseder of supersededBy[condition]) {
          if (this.conditions[superseder].active || this.someAncestorSupersedesThis(superseder)) {
            return true;
          }
        }
        return false;
      },
      fixTriggers: function(condition) {
        const triggers = conditionsData.conditions[condition].triggers;
        for (const trigger of triggers) {
          this.conditions[trigger].active = this.someAncestorTriggersThis(trigger);
          this.fixSupersedes(trigger);
          this.fixTriggers(trigger);
        }
      },
      fixSupersedes: function(condition) {
        const supersedes = conditionsData.conditions[condition].supersedes;
        for (const superseder of supersedes) {
          this.conditions[superseder].superseded = this.someAncestorSupersedesThis(superseder);
          this.conditions[superseder].active =  this.someAncestorTriggersThis(superseder);
          this.fixSupersedes(superseder);
        }
      },
      onClickCondition: function(button) {
        const globalReadOnly = this.editModes && ("isReadOnly" in this.editModes) && this.editModes.isReadOnly;
        if (globalReadOnly) {
          return;
        }
        const thisCondition = this.conditions[button];
        if (thisCondition.superseded) {
          return;
        }
        thisCondition.selected = !thisCondition.selected;
        if (button === "normal") {
          if (thisCondition.selected) {
            for (const condition in conditionsData.conditions) {
              if (condition !== "normal") {
                this.conditions[condition].selected = false;
                this.conditions[condition].active = false;
                this.conditions[condition].superseded = false;
              }
            }
          } else {
            thisCondition.active = false;
          }
        } else {
          if (thisCondition.selected) {
            thisCondition.active = true;
            this.conditions.normal.selected = false;
            this.conditions.normal.active = false;
          } else {
            thisCondition.active = this.someAncestorTriggersThis(button);
          }
          this.fixTriggers(button);
          this.fixSupersedes(button);
        }
      }
    }
  }
</script>

<style scoped>
  .colorBar {
  }
  #bar0 {
    fill: #ffb380;
  }
  #bar1 {
    fill: #ff7f2a;
  }
  #bar2 {
    fill: #d45500;
  }
  #bar3 {
    fill: #803300;
  }
  #bar4 {
    fill: #552200;
  }
  .conditionBorder {
    fill: #FFFFFF;
    stroke: #000000;
  }
  .conditionBox {
    fill: #FFFFFF;
    stroke: #000000;
  }
  .conditionName {
    dominant-baseline: middle;
    text-anchor: middle;
    font-size: 6px;
    font-weight: bold;
  }
  .conditionDesc {
    dominant-baseline: middle;
    text-anchor: middle;
    font-size: 6px;
    font-style: italic;
  }
  .connector {
    stroke: #000000;
    stroke-width: 1;
  }

  svg {
    width: 100%;
    height: auto;
  }
  .selected .conditionBorder {
    fill: var(--status-color);
  }
  .selected .conditionBox {
    fill: var(--status-color);
  }
  .active .conditionBox {
    fill: var(--status-color);
  }
  .superseded .conditionBox {
    fill: var(--inapplicable-color);
  }
</style>

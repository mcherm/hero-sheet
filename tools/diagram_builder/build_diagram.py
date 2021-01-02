#
# This outputs a svg file we will use for displaying conditions.
#

FULL_WIDTH = 490
FULL_HEIGHT = 380
CONDITION_WIDTH = 50
CONDITION_HEIGHT = 28

TOP_OF_SVG = f"""\
<svg
    xmlns="http://www.w3.org/2000/svg"
    id="conditions"
    viewBox="0 0 {FULL_WIDTH} {FULL_HEIGHT}"
    width="{FULL_WIDTH}"
    height="{FULL_HEIGHT}"
>
"""

TOP_OF_VUE = f"""\
<!-- WARNING: Generated Code... Do Not Modify! -->
<!-- See tools/diagram_builder/build_diagram.py instead. -->
<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    id="conditions"
    viewBox="0 0 {FULL_WIDTH} {FULL_HEIGHT}"
  >
"""

BEGIN_CONTENT = f"""\
  <defs>
    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
      <polygon points="0 0, 10 3.5, 0 7" />
    </marker>
  </defs>
  <g>
"""
END_CONTENT = """\
  </g>
</svg>
"""

MIDDLE_OF_VUE = """\
</template>

<script>
  const conditionsData = require("@/data/conditionsData.json");
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
    inject: {
      getCharsheet: {},
      editModes: { editMode: "READ_ONLY" },
    },
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
        if (this.editModes.editMode === "READ_ONLY") {
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
            this.getCharsheet().status.damagePenalty = 0;
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
      },
      onClickDamageButton: function(button) {
        if (this.editModes.editMode === "READ_ONLY") {
          return;
        }
        const delta = {"recover": +1, "damaged": -1}[button];
        this.getCharsheet().status.damagePenalty = Math.min(0, this.getCharsheet().status.damagePenalty + delta);
        if (this.getCharsheet().status.damagePenalty !== 0) {
          this.conditions.normal.selected = false;
          this.conditions.normal.active = false;
        }
      },
    }
  }
</script>

"""

STYLESHEET = """\
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
  .damageTextBox {
    fill: #FFFFFF;
    stroke: #000000;
  }
  .damageText {
    dominant-baseline: middle;
    text-anchor: middle;
  }
  .damageDescription {
    dominant-baseline: middle;
    text-anchor: middle;
    font-size: 6px;
    font-weight: bold;
  }
  .damageButton {
    fill: #FFFFFF;
    stroke: #000000;
  }
  .damageButtonText {
    dominant-baseline: middle;
    text-anchor: middle;
    font-size: 6px;
  }
"""

SVG_STYLESHEET = f"""\
  <style type="text/css">
    {STYLESHEET}
  </style>
"""

VUE_STYLESHEET = f"""\
<style scoped>
{STYLESHEET}
  svg {{
    width: 100%;
    height: auto;
  }}
  .damageTextBox.damaged {{
    fill: var(--in-play-entry-field);
  }}
  .selected .conditionBorder {{
    fill: var(--in-play-entry-field);
  }}
  .selected .conditionBox {{
    fill: var(--in-play-entry-field);
  }}
  .active .conditionBox {{
    fill: var(--in-play-entry-field);
  }}
  .superseded .conditionBox {{
    fill: var(--inapplicable-color);
  }}
</style>
"""


def ff(f):
    """Given a float (or int) this returns the same float unless it is an exact int,
    in which case it returns the corresponding int. It is useful to avoid numbers
    ending in ".0"."""
    if (isinstance(f, float) and f.is_integer()):
        return round(f)
    else:
        return f

LEFT_MARGIN = 20
X_SUB_SPACING = 40
RIGHTMOST = LEFT_MARGIN + X_SUB_SPACING * 11
C1, C2, C3, C4, C5, C6, C7, C8, C9, C10, C11 = range(LEFT_MARGIN, RIGHTMOST, X_SUB_SPACING)
CMID = C6

BAR_BOUNDS = [
    0, 60, 120, 220, 320, FULL_HEIGHT
]

def center_of_bar_minus_half_condition(bar_index):
    top = BAR_BOUNDS[bar_index]
    bottom = BAR_BOUNDS[bar_index + 1]
    middle = top + ((bottom - top) / 2)
    return middle - (CONDITION_HEIGHT / 2)

Y_SUB_SPACING = 20
R0 = center_of_bar_minus_half_condition(0)
R1 = center_of_bar_minus_half_condition(1)
R2 = center_of_bar_minus_half_condition(2)
R2a = R2 - Y_SUB_SPACING
R2b = R2 + Y_SUB_SPACING
R3 = center_of_bar_minus_half_condition(3)
R3a = R3 - Y_SUB_SPACING
R3b = R3 + Y_SUB_SPACING
R4 = center_of_bar_minus_half_condition(4)

CONDITION_DATA = [
    ("Normal", "", "No Conditions", "",                                   CMID, R0,  "basic"),
    ("Dazed", "", "Single Action", "",                                      C1, R1,  "basic"),
    ("Hindered", "", "Half Move", "",                                       C3, R1,  "basic"),
    ("Vulnerable", "", "Half Active Def", "",                               C5, R1,  "basic"),
    ("Impaired", "(stat)", "-1 on checks", "",                              C7, R1,  "basic"),
    ("Fatigued", "", "-1 on checks", "",                                    C9, R1,  "combined"),
    ("Entranced", "", "", "{Stunned}",                                     C11, R1,  "combined"),
    ("Staggered", "", "", "{Dazed + Hindered}",                             C2, R2b, "combined"),
    ("Stunned", "", "No Actions", "",                                       C1, R2a, "basic"),
    ("Prone", "", "+/-5 attacks", "{hindered}",                             C4, R2b, "dual"),
    ("Immobile", "", "No Move", "",                                         C3, R2a, "basic"),
    ("Surprised", "", "", "{Stunned + Vulnerable}",                         C6, R2b, "combined"),
    ("Defenseless", "", "Active Def = 0", "",                               C5, R2a, "basic"),
    ("Weakened", "(pwr)", "-X on power/stat", "",                           C8, R2b, "basic"),
    ("Disabled", "(stat)", "-5 on checks", "",                              C7, R2a, "basic"),
    ("Compelled", "", "1 forced action", "",                               C10, R2b, "basic"),
    ("Exhausted", "", "", "{Impaired + Hindered}",                          C9, R2a, "combined"),
    ("Restrained", "", "", "{Vulnerable + Hindered/Immobile}",             C11, R2a, "combined"),
    ("Incapacitated", "", "", "{Defenseless + Stunned + Unaware + Prone}",  C1, R3b, "combined"),
    ("Asleep", "", "", "{Defenseless + Stunned + Unaware}",                 C2, R3a, "combined"),
    ("Paralyzed", "", "", "{Defenseless + Immobile + Stunned(physical)}",   C3, R3b, "combined"),
    ("Blind", "", "", "{Unaware(see) + Hindered + Vulnerable}",             C4, R3a, "combined"),
    ("Unaware", "(sense)", "Can't Perceive", "",                            C5, R3b, "basic"),
    ("Deaf", "", "", "Unaware(hear)",                                       C6, R3a, "combined"),
    ("Debilitated", "(stat)", "Varies by Stat", "",                         C7, R3b, "basic"),
    ("Controlled", "", "Forced actions", "",                               C10, R3b, "basic"),
    ("Transformed", "", "Alternate Form", "",                               C9, R3a, "basic"),
    ("Bound", "", "", "{Defenseless + Immobile + Impaired}",               C11, R3a, "combined"),
    ("Dying", "", "Fort Checks", "{Incapacitated}",                       CMID, R4,  "dual"),
]


COUNTER_PLACEMENT = (C2 + (CONDITION_WIDTH / 2), R0 + (CONDITION_HEIGHT / 2))

H_X = CONDITION_WIDTH / 2
H_Y = CONDITION_HEIGHT / 2
A_Y = CONDITION_HEIGHT
AR = 10 # Arrowhead length

CONNECTOR_DATA = [
    ( C1 + H_X,  R1 + A_Y,  C1 + H_X, R2a - AR, True),  # Dazed -> Stunned
    ( C3 + H_X,  R1 + A_Y,  C3 + H_X, R2a - AR, True),  # Hindered -> Immobile
    ( C5 + H_X,  R1 + A_Y,  C5 + H_X, R2a - AR, True),  # Vulnerable -> Defenseless
    ( C7 + H_X,  R1 + A_Y,  C7 + H_X, R2a - AR, True),  # Impaired -> Disabled
    ( C9 + H_X,  R1 + A_Y,  C9 + H_X, R2a - AR, True),  # Fatigued -> Exhausted
    (C10 + H_X, R2b + A_Y, C10 + H_X, R3b - AR, True),  # Compelled -> Controlled
    (C11 + H_X, R2a + A_Y, C11 + H_X, R3a - AR, True),  # Restrained -> Bound
    ( C7 + H_X, R2a + A_Y,  C7 + H_X, R3b - AR, True),  # Disabled -> Debilitated
    ( C8 + H_X, R2b + A_Y,  C8 + H_X, R3a - 8,  False), # Weakened -> point-A
    ( C8 + H_X, R3a - 8,    C7 + H_X, R3a - 8,  False), # point-A -> point-B
    ( C4 + H_X, R3a + A_Y,  C5 + H_X, R3b,      False), # Blind -> Unaware
    ( C6 + H_X, R3a + A_Y,  C5 + H_X, R3b,      False), # Deaf -> Unaware
]


class CommonWriter:
    def __init__(self, outFile):
        self.outFile = outFile

    def write(self, s):
        self.outFile.write(s)

    def write_bar(self, index):
        bar_top = BAR_BOUNDS[index]
        bar_bottom = BAR_BOUNDS[index + 1]
        bar_height = bar_bottom - bar_top
        self.write(f"""\
            <rect id="bar{index}" class="colorBar"
               x="0" y="{ff(bar_top)}"
               width="{FULL_WIDTH}" height="{ff(bar_height)}"
            />\n""")

    def write_bars(self):
        for i in range(5):
            self.write_bar(i)

    def damage_button_extras(self, name):
        """Subclasses override this to insert attributes in the buttons."""
        return ""

    def damage_penalty_value(self):
        """Subclasses override this to provide the value to show for the damage penalty."""
        return "0"

    def damage_text_box_extras(self):
        """Subclasses override this to provide the value to show for the damage penalty."""
        return ""

    def write_damage_penalty(self):
        TEXT_H_OFFSET = 3
        TEXT_V_OFFSET = -5
        TEXT_WIDTH = 26
        TEXT_HEIGHT = 18
        DESCRIPTION_V_OFFSET = 12
        BUTTON_H_OFFSET = 5
        BUTTON_V_OFFSET = 6
        BUTTON_WIDTH = 30
        BUTTON_HEIGHT = 9
        self.write(f"""\
            <g transform="translate({ff(COUNTER_PLACEMENT[0])}, {ff(COUNTER_PLACEMENT[1])})">
              <rect class="damageTextBox"{self.damage_text_box_extras()} x="{ff(-TEXT_H_OFFSET - TEXT_WIDTH)}" y="{ff(TEXT_V_OFFSET)}" width="{ff(TEXT_WIDTH)}" height="{ff(TEXT_HEIGHT)}"/>
              <text class="damageDescription" x="0" y="{ff(-DESCRIPTION_V_OFFSET)}">Damage Penalty</text>
              <text class="damageText" x="{ff(-TEXT_H_OFFSET - TEXT_WIDTH/2)}" y="{ff(TEXT_V_OFFSET + TEXT_HEIGHT/2)}">{self.damage_penalty_value()}</text>
              <g{self.damage_button_extras('Recover')}>
                <rect class="damageButton" x="{ff(BUTTON_H_OFFSET)}" y="{ff(-BUTTON_V_OFFSET)}" width="{BUTTON_WIDTH}" height="{BUTTON_HEIGHT}" rx="2.5" ry="2.5"/>
                <text class="damageButtonText" x="{ff(BUTTON_H_OFFSET + BUTTON_WIDTH/2)}" y="{ff(-BUTTON_V_OFFSET + BUTTON_HEIGHT/2)}">Recover</text>
              </g>
              <g{self.damage_button_extras('Damaged')}>
                <rect class="damageButton" x="{ff(BUTTON_H_OFFSET)}" y="{ff(BUTTON_V_OFFSET)}" width="{BUTTON_WIDTH}" height="{BUTTON_HEIGHT}" rx="2.5" ry="2.5"/>
                <text class="damageButtonText" x="{ff(BUTTON_H_OFFSET + BUTTON_WIDTH/2)}" y="{ff(BUTTON_V_OFFSET + BUTTON_HEIGHT/2)}">Damaged</text>
              </g>
            </g>\n""")

    def condition_extras(self, name):
        """Returns a string to be inserted as an attribute of the g tag. Defaults to an
        empty string, but subclasses can return attributes beginning with a space."""
        return ""

    def write_condition(self, name, params, desc, affects, x, y, cond_type):
        LINE_SPACING = 7
        rounded_corners = {"basic": True, "combined": False, "dual": True}[cond_type]
        self.write(f"""\
            <g id="condition_{name.lower()}" class="condition"{self.condition_extras(name)}>
                <rect class="conditionBorder"
                    x="{ff(x)}" y="{ff(y)}"
                    width="{CONDITION_WIDTH}" height="{CONDITION_HEIGHT}"
                    {'rx="7" ry="7"' if rounded_corners else ''}
                />
                <rect class="conditionBox"
                    x="{ff(x + 2)}" y="{ff(y + 2)}"
                    width="{CONDITION_WIDTH - 4}" height="{CONDITION_HEIGHT - 4}"
                    {'rx="5" ry="5"' if rounded_corners else ''}
                />
                <text class="conditionName"
                    x="{ff(x + CONDITION_WIDTH / 2)}" y="{ff(y + CONDITION_HEIGHT / 2)}"
                >{name}{params}</text>
                <text class="conditionDesc"
                    x="{ff(x + CONDITION_WIDTH / 2)}" y="{ff(LINE_SPACING + y + CONDITION_HEIGHT / 2)}"
                >{desc}</text>
            </g>\n""")

    def write_conditions(self):
        for condition_values in CONDITION_DATA:
            self.write_condition(*condition_values)

    def write_line(self, x0, y0, x1, y1, isArrow):
        arrow_string = f'marker-end="url(#arrowhead)"' if isArrow else ""
        self.write(f"""\
            <line x1="{ff(x0)}" y1="{ff(y0)}" x2="{ff(x1)}" y2="{ff(y1)}" class="connector" {arrow_string}/>\n""")

    def write_lines(self):
        for line_values in CONNECTOR_DATA:
            self.write_line(*line_values)

    def write_file(self):
        raise NotImplemented() # subclasses should implement this



class SVGFileWriter(CommonWriter):

    def write_file(self):
        self.write(TOP_OF_SVG)
        self.write(BEGIN_CONTENT)
        self.write(SVG_STYLESHEET)
        self.write_bars()
        self.write_lines()
        self.write_damage_penalty()
        self.write_conditions()
        self.write(END_CONTENT)


class VueFileWriter(CommonWriter):
    def damage_button_extras(self, name):
        return f" @click=\"onClickDamageButton('{name.lower()}')\""

    def damage_penalty_value(self):
        return "{{getCharsheet().status.damagePenalty}}"

    def condition_extras(self, name):
        return f" :class=\"conditions.{name.lower()}\" @click=\"onClickCondition('{name.lower()}')\""

    def damage_text_box_extras(self):
        return " :class=\"{'damaged': getCharsheet().status.damagePenalty !== 0}\""

    def write_file(self):
        self.write(TOP_OF_VUE)
        self.write(BEGIN_CONTENT)
        self.write_bars()
        self.write_lines()
        self.write_damage_penalty()
        self.write_conditions()
        self.write(END_CONTENT)
        self.write(MIDDLE_OF_VUE)
        self.write(VUE_STYLESHEET)


def main():
    with open("conditions.svg", "w", encoding="utf-8") as out_file:
        file_writer = SVGFileWriter(out_file)
        file_writer.write_file()
    with open("../../src/components/ConditionsImage.vue", "w", encoding="utf-8") as out_file:
        file_writer = VueFileWriter(out_file)
        file_writer.write_file()


if __name__ == "__main__":
    main()

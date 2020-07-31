#
# This outputs a svg file we will use for displaying conditions.
#

FULL_WIDTH = 520
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
  const conditionsData = require("../data/conditionsData.json");
  const triggeredBy = function() {
    const result = {};
    for (const condition in conditionsData.conditions) {
      result[condition] = [];
    }
    for (const condition in conditionsData.conditions) {
      for (const trigger of conditionsData.conditions[condition].triggers) {
        result[trigger].push(condition);
      }
    }
    return result;
  }();

  export default {
    name: "ConditionsImage.vue",
    inject: ["getCharsheet"],
    data: function() {
      return {
        conditions: this.getCharsheet().status.conditions,
      }
    },
    methods: {
      onClickCondition: function(button) {
        const vueThis = this;
        const thisCondition = this.conditions[button];
        thisCondition.selected = !thisCondition.selected;
        const someAncestorTriggersThis = function(condition) {
          for (const trigger of triggeredBy[condition]) {
            if (vueThis.conditions[trigger].selected || someAncestorTriggersThis(trigger)) {
              return true;
            }
          }
          return false;
        }
        if (thisCondition.selected) {
          thisCondition.active = true;
        } else {
          thisCondition.active = someAncestorTriggersThis(button);
        }
        const fixTriggersAndSupersedes = function(condition) {
          const triggers = conditionsData.conditions[condition].triggers;
          for (const trigger of triggers) {
            vueThis.conditions[trigger].active = someAncestorTriggersThis(trigger);
            fixTriggersAndSupersedes(trigger);
          }
        }
        fixTriggersAndSupersedes(button);
      }
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
  .selected .conditionBorder {{
    fill: #F7F711;
  }}
  .selected .conditionBox {{
    fill: #F7F711;
  }}
  .active .conditionBox {{
    fill: #F7F711;
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
RIGHTMOST = LEFT_MARGIN + X_SUB_SPACING * 12
C1, C2, C3, C4, C5, C6, C7, C8, C9, C10, C11, C12 = range(LEFT_MARGIN, RIGHTMOST, X_SUB_SPACING)
CMID = (C6 + C7) / 2

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
    ("Dazed", "", "Single Action", "",                                      C2, R1,  "basic"),
    ("Hindered", "", "Half Move", "",                                       C4, R1,  "basic"),
    ("Vulnerable", "", "Half Active Def", "",                               C6, R1,  "basic"),
    ("Impaired", "(stat)", "-1 on checks", "",                              C8, R1,  "basic"),
    ("Fatigued", "", "-1 on checks", "",                                   C10, R1,  "combined"),
    ("Prone", "", "+/-5 attacks", "{hindered}",                             C1, R2b, "dual"),
    ("Stunned", "", "No Actions", "",                                       C2, R2a, "basic"),
    ("Staggered", "", "", "{Dazed + Hindered}",                             C3, R2b, "combined"),
    ("Immobile", "", "No Move", "",                                         C4, R2a, "basic"),
    ("Surprised", "", "", "{Stunned + Vulnerable}",                         C5, R2b, "combined"),
    ("Defenseless", "", "Active Def = 0", "",                               C6, R2a, "basic"),
    ("Weakened", "(pwr)", "-X on power/stat", "",                           C7, R2b, "basic"),
    ("Disabled", "(stat)", "-5 on checks", "",                              C8, R2a, "basic"),
    ("Compelled", "", "1 forced action", "",                                C9, R2b, "basic"),
    ("Exhausted", "", "", "{Impaired + Hindered}",                         C10, R2a, "combined"),
    ("Entranced", "", "", "{Stunned}",                                     C11, R2b, "combined"),
    ("Restrained", "", "", "{Vulnerable + Hindered/Immobile}",             C12, R2a, "combined"),
    ("Incapacitated", "", "", "{Defenseless + Stunned + Unaware + Prone}",  C1, R3b, "combined"),
    ("Asleep", "", "", "{Defenseless + Stunned + Unaware}",                 C2, R3a, "combined"),
    ("Paralyzed", "", "", "{Defenseless + Immobile + Stunned(physical)}",   C3, R3b, "combined"),
    ("Blind", "", "", "{Unaware(see) + Hindered + Vulnerable}",             C4, R3a, "combined"),
    ("Unaware", "(sense)", "Can't Perceive", "",                            C5, R3b, "basic"),
    ("Deaf", "", "", "Unaware(hear)",                                       C6, R3a, "combined"),
    ("Debilitated", "(stat)", "Varies by Stat", "",                         C7, R3b, "basic"),
    ("Controlled", "", "Forced actions", "",                                C9, R3a, "basic"),
    ("Transformed", "", "Alternate Form", "",                              C10, R3b, "basic"),
    ("Bound", "", "", "{Defenseless + Immobile + Impaired}",               C12, R3a, "combined"),
    ("Dying", "", "Fort Checks", "{Incapacitated}",                       CMID, R4,  "dual"),
]


H_X = CONDITION_WIDTH / 2
H_Y = CONDITION_HEIGHT / 2
A_Y = CONDITION_HEIGHT
AR = 10 # Arrowhead length

CONNECTOR_DATA = [
    ( C2 + H_X,  R1 + A_Y,  C2 + H_X, R2a - AR, True), # Dazed -> Stunned
    ( C4 + H_X,  R1 + A_Y,  C4 + H_X, R2a - AR, True), # Hindered -> Immobile
    ( C6 + H_X,  R1 + A_Y,  C6 + H_X, R2a - AR, True), # Vulnerable -> Defenseless
    ( C8 + H_X,  R1 + A_Y,  C8 + H_X, R2a - AR, True), # Impaired -> Disabled
    (C10 + H_X,  R1 + A_Y, C10 + H_X, R2a - AR, True), # Fatigued -> Exhausted
    ( C9 + H_X, R2b + A_Y,  C9 + H_X, R3a - AR, True), # Compelled -> Controlled
    (C12 + H_X, R2a + A_Y, C12 + H_X, R3a - AR, True), # Restrained -> Bound
    ( C7 + H_X, R2b + A_Y,  C7 + H_X, R3b - AR, True), # Weakened -> Debilitated
    ( C8 + H_X, R2a + A_Y,  C8 + H_X, R3a - 8,  False), # Disabled -> point-A
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
        self.write_conditions()
        self.write(END_CONTENT)


class VueFileWriter(CommonWriter):
    def condition_extras(self, name):
        return f" :class=\"conditions.{name.lower()}\" @click=\"onClickCondition('{name.lower()}')\""

    def write_file(self):
        self.write(TOP_OF_VUE)
        self.write(BEGIN_CONTENT)
        self.write_bars()
        self.write_lines()
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

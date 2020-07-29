#
# This outputs a svg file we will use for displaying conditions.
#

OUT_FILENAME = "conditions.svg"

FULL_WIDTH = 520
FULL_HEIGHT = 400

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
  .conditionBox {
    fill: #FFFFFF;
    stroke: #000000;
  }
  .conditionName {
    dominant-baseline: middle;
    text-anchor: middle;
    font-size: 6;
    font-weight: bold;
  }
  .conditionDesc {
    dominant-baseline: middle;
    text-anchor: middle;
    font-size: 6;
    font-style: italic;
  }
"""

HEADER = f"""\
<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg
   xmlns="http://www.w3.org/2000/svg"
   id="conditions"
   version="1.1"
   viewBox="0 0 {FULL_WIDTH} {FULL_HEIGHT}"
   width="{FULL_WIDTH}mm"
   height="{FULL_HEIGHT}mm"
>
  <style type="text/css">
    <![CDATA[{STYLESHEET}]]>
  </style>
  <g>
"""

FOOTER = """\
  </g>
</svg>
"""

LEFT_MARGIN = 20
X_SUB_SPACING = 40
RIGHTMOST = LEFT_MARGIN + X_SUB_SPACING * 12
C1, C2, C3, C4, C5, C6, C7, C8, C9, C10, C11, C12 = range(LEFT_MARGIN, RIGHTMOST, X_SUB_SPACING)
CMID = (C6 + C7) / 2

Y_SUB_SPACING = 16
R0 = 26
R1 = R0 + (FULL_HEIGHT / 5)
R2 = R1 + (FULL_HEIGHT / 5)
R2a = R2 - Y_SUB_SPACING
R2b = R2 + Y_SUB_SPACING
R3 = R2 + (FULL_HEIGHT / 5)
R3a = R3 - Y_SUB_SPACING
R3b = R3 + Y_SUB_SPACING
R4 = R3 + (FULL_HEIGHT / 5)

CONDITION_DATA = [
    ("Normal", "No Conditions",                                   CMID, R0,  "basic"),
    ("Dazed", "Single Action",                                      C2, R1,  "basic"),
    ("Hindered", "Half Move",                                       C4, R1,  "basic"),
    ("Vulnerable", "Half Active Def",                               C6, R1,  "basic"),
    ("Impaired(stat)", "-1 on checks",                              C8, R1,  "basic"),
    ("Fatigued", "-1 on checks",                                   C10, R1,  "combined"),
    ("Prone", "+/-5 attacks {hindered}",                            C1, R2b, "dual"),
    ("Stunned", "No Actions",                                       C2, R2a, "basic"),
    ("Staggered", "{Dazed + Hindered}",                             C3, R2b, "combined"),
    ("Immobile", "No Move",                                         C4, R2a, "basic"),
    ("Surprised", "{Stunned + Vulnerable}",                         C5, R2b, "combined"),
    ("Defenseless", "Active Def = 0",                               C6, R2a, "basic"),
    ("Weakened(pwr)", "-X on power/stat",                           C7, R2b, "basic"),
    ("Disabled(stat)", "-5 on checks",                              C8, R2a, "basic"),
    ("Compelled", "They get one action",                            C9, R2b, "basic"),
    ("Exhausted", "{Impaired + Hindered}",                         C10, R2a, "combined"),
    ("Entranced", "{Stunned}",                                     C11, R2b, "combined"),
    ("Restrained", "{Vulnerable + Hindered/Immobile}",             C12, R2a, "combined"),
    ("Incapacitated", "{Defenseless + Stunned + Unaware + Prone}",  C1, R3a, "combined"),
    ("Asleep", "{Defenseless + Stunned + Unaware}",                 C2, R3b, "combined"),
    ("Paralyzed", "{Defenseless + Immobile + Stunned(physical)}",   C3, R3a, "combined"),
    ("Blind", "{Unaware(see) + Hindered + Vulnerable}",             C4, R3b, "combined"),
    ("Unaware(sense)", "Can't Perceive",                            C5, R3a, "basic"),
    ("Deaf", "Unaware(hear)",                                       C6, R3b, "combined"),
    ("Debilitated(stat)", "Varies by Stat",                         C7, R3a, "basic"),
    ("Controlled", "They Control You",                              C9, R3a, "basic"),
    ("Transformed", "Alternate Form",                              C10, R3b, "basic"),
    ("Bound", "{Defenseless + Immobile + Impaired}",               C12, R3a, "combined"),
    ("Dying", "Fort Checks + {Incapacitated}",                    CMID, R4,  "dual"),
]


class FileWriter:
    def __init__(self, outFile):
        self.outFile = outFile

    def write(self, s):
        self.outFile.write(s)

    def write_bar(self, index):
        self.write(f"""\
            <rect
               x="0"
               y="{index * FULL_HEIGHT / 5}"
               width="{FULL_WIDTH}"
               height="{FULL_HEIGHT / 5}"
               id="bar{index}"
               class="colorBar"
            />\n""")

    def write_bars(self):
        for i in range(5):
            self.write_bar(i)

    def write_condition(self, name, desc, x, y, cond_type):
        CONDITION_WIDTH = 48
        CONDITION_HEIGHT = 26
        LINE_SPACING = 7
        self.write(f"""\
            <rect
                class="conditionBox"
                x="{x}"
                y="{y}"
                width="{CONDITION_WIDTH}"
                height="{CONDITION_HEIGHT}"
                rx="5"
                ry="5"
              />
            <text
                class="conditionName"
                x="{x + CONDITION_WIDTH / 2}"
                y="{y + CONDITION_HEIGHT / 2}"
            >{name}</text>
            <text
                class="conditionDesc"
                x="{x + CONDITION_WIDTH / 2}"
                y="{LINE_SPACING + y + CONDITION_HEIGHT / 2}"
            >{desc}</text>\n""")

    def write_conditions(self):
        for condition_values in CONDITION_DATA:
            self.write_condition(*condition_values)

    def write_file(self):
        self.write(HEADER)
        self.write_bars()
        self.write_conditions()
        self.write(FOOTER)


def main():
    with open(OUT_FILENAME, "w", encoding="utf-8") as out_file:
        file_writer = FileWriter(out_file)
        file_writer.write_file()

if __name__ == "__main__":
    main()

/*
 * Code to generate the document definition for PDF display of a charsheet.
 */

const documentDefinition = function(charsheet) {


  const abilitiesTable = function() {
    return {
      layout: 'headerLineOnly',
      table: {
        headerRows: 1,
        body: [
          [{text: 'Abilities', style: 'subheader'}, {text: ''}]
        ].concat(Object.keys(charsheet.abilities).map(
          (ability) => [
            ability,
//            typeof charsheet.abilities[ability].ranks === "number" ? charsheet.abilities[ability].ranks : "N/A"
            {text: typeof charsheet.abilities[ability].ranks === "number" ? charsheet.abilities[ability].ranks : "n/a", alignment: 'right'}
          ]
        ))
      },
    };
  };

  const skillsTable = function() {
    return {
      layout: 'headerLineOnly',
      table: {
        headerRows: 1,
        body: [
          [{text: 'Skills', style: 'subheader'}, {text: ''}]
        ].concat(charsheet.skills.skillList.map(
          (skill) => [
            skill.name,
            {text: typeof skill.ranks === "number" ? skill.ranks : "n/a", alignment: 'right'}
          ]
        ))
      },
    };
  };

  const defensesTable = function() {
    return {
      layout: 'headerLineOnly',
      table: {
        headerRows: 1,
        body: [
          [{text: 'Defenses', style: 'subheader'}, {text: ''}]
        ].concat(Object.keys(charsheet.defenses).map(
          (defense) => [
            defense,
            {text: typeof charsheet.defenses[defense].ranks === "number" ? charsheet.defenses[defense].ranks : "n/a", alignment: 'right'}
          ]
        ))
      },
    };
  };
  return {
//    content: `Sample PDF for ${charsheet.naming.name}.`
    content: [
      {
        columns: [
          [
            {text: `${charsheet.naming.name}`, style: 'header'},
            `${charsheet.background}`,
          ],
          {
            image: 'data:image/png;base64,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',
            width: 60,
            alignment: 'right',
          },

        ],
      },
      {
        columns: [
          [
            abilitiesTable(),
            skillsTable(),
          ],
          [
           defensesTable(),
          ],
        ]
      },
    ],
    styles: {
      header: {
        fontSize: 24,
        bold: true,
        margin: [0, 0, 0, 10]
      },
      subheader: {
        fontSize: 14,
        bold: true,
        margin: [0, 10, 0, 5]
      }
    }
  };
};

export {
  documentDefinition,
};

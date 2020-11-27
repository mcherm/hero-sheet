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
          (ability) => [ability,charsheet.abilities[ability].ranks]
        ))
      },
    };
  };

  return {
//    content: `Sample PDF for ${charsheet.naming.name}.`
    content: [
      {text:`${charsheet.naming.name}`, style: 'header'},
      `${charsheet.background}`,
      {
        columns: [
          [
            abilitiesTable(),
            {
              layout: 'headerLineOnly',
              table: {
                headerRows: 1,
                body: [
                  [{text: 'Skills', style: 'subheader'}, {text: ''}],
                  ['Clawing', '25'],
                  ['Biting Feet', '25'],
                  ['Climbing up', '18'],
                  ['Climbing down', '3'],
                  ['Jumping up', '20'],
                  ['Jumping down', '100'],
                ]
              },
            },

            ],
          {
            layout: 'headerLineOnly',
            table: {
              headerRows: 1,
              body: [
                [{text: 'Defenses', style: 'subheader'},{text:''}],
                ['Dodge', '5'],
                ['Fortitude', '15'],
                ['Stamina', '3',],
                ['Snarkiness', '15'],
                ['Sneakiness', '30']
              ]
            },
          }
        ]
      },
    ],
    styles: {
      header: {
        fontSize: 22,
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

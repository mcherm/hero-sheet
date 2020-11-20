/*
 * Code to generate the document definition for PDF display of a charsheet.
 */

const documentDefinition = function(charsheet) {
  return {
    content: `Sample PDF for ${charsheet.naming.name}.`
  };
};

export {
  documentDefinition,
};

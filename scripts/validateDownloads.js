//
// This goes theough every charshet in the download directory, updates each to
// the latest (experimental) version, then validates it against the charsheet
// schema.
//
const fs = require("fs");
const {upgradeVersion} = require("../src/js/heroSheetVersioning.js");


const ajv = function() {
  const Ajv = require('ajv');
  const ajv = Ajv({allErrors: true});
  const commonSchema = JSON.parse(fs.readFileSync("src/schema/common.schema.json", 'utf8'));
  ajv.addSchema(commonSchema, "commonSchema");
  const charsheetSchema = JSON.parse(fs.readFileSync("src/schema/charsheet.schema.json", 'utf8'));
  ajv.addSchema(charsheetSchema, "charsheetSchema");
  return ajv;
}();

try {
  const usersDir = "download/mutants/users";
  const userDirs = fs.readdirSync(usersDir);
  const validateFilesUntilError = function() {
    for (const userDir of userDirs) {
      const charsDir = `${usersDir}/${userDir}/characters`;
      if (fs.existsSync(charsDir)) {
        console.log(`-- ${charsDir}`);
        const charFiles = fs.readdirSync(charsDir);
        for (const charFile of charFiles) {
          const charsheetFile = `${charsDir}/${charFile}`;
          let charsheet
          try {
            charsheet = JSON.parse(fs.readFileSync(charsheetFile, 'utf8'));
          } catch(err) {
            console.error(`\nInvalid JSON in ${charsheetFile}.`);
            console.error(err);
            return 1;
          }
          upgradeVersion(charsheet, true);
          const isValid = ajv.validate("charsheetSchema", charsheet);
          if (isValid) {
            console.log(`${charFile} OK`);
          } else {
            console.error(`\nFailed Schema Validation for ${charFile}:\n${JSON.stringify(ajv.errors, null, 2)}`);
            return 1;
          }
        }
      }
    }
    return 0;
  };
  const exitCode = validateFilesUntilError();
  process.exitCode = exitCode;

} catch (err) {
  console.error(err);
  process.exitCode = 1
}

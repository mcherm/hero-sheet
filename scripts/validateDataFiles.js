//
// This goes through every file in the data directory and validates it against
// the corresponding schema.
//
const fs = require("fs");
const { spawnSync } = require("child_process");

const dataFileRegExp = RegExp("^([a-zA-Z0-9]+)\.json$");

try {
  const files = fs.readdirSync("./src/data");
  const runFilesUntilError = function() {
    for (const file of files) {
      const match = file.match(dataFileRegExp);
      if (!match) {
        throw new Error(`File '${file}' in data directory has an unexpected filename.`);
      }
      const name = match[1];
      console.log(`Will now process ${name}`);
      const spawnResult = spawnSync("ajv", [
        "-d", `src/data/${name}.json`,
        "-s", `src/schema/${name}.schema.json`,
        "-r", "src/schema/common.schema.json"
      ]);
      if (spawnResult.stderr.length) {
        console.error(spawnResult.stderr.toString());
      }
      if (spawnResult.stdout.length) {
        console.log(spawnResult.stdout.toString());
      }
      const status = spawnResult.status;
      if (status) {
        return 1; // We got an error, so exit
      }
    }
    return 0;
  };
  const exitCode = runFilesUntilError();
  process.exitCode = exitCode;

} catch (err) {
  console.error(err);
  process.exitCode = 1;
}

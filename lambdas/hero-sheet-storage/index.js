console.log("version 0.9.0");

const LOG_REQUESTS = true;
const DEVELOPER_MODE = true;

const crypto = require("crypto");
const AWS = require("node_modules/aws-sdk");
const Ajv = require('node_modules/ajv');


const s3 = new AWS.S3();

// Initialize the schema validator
const ajv = Ajv({allErrors: true});
for (const schemaName of ["common", "charsheet"]) {
  const schema = require(`schema/${schemaName}.schema.json`);
  ajv.addSchema(schema, schemaName);
}

/*
 * Attempts to validate the schema. Returns REGARDLESS of whether it is successful,
 * but will log failures.
 */
function validateSchema(charsheet) {
  console.log('Schema Validation Running'); // FIXME: Remove
  const isValid = ajv.validate("charsheet", charsheet);
  if (!isValid) {
    console.error("Schema Validation Failed");
    console.error(`Schema Validation Errors: ${JSON.stringify(ajv.errors, null, 2)}`);
  }
}

console.log("loaded");

/*
 * Given a deployment, this returns the correct bucket to use.
 */
const getBucket = function(deployment) {
  const result = {
    "prod": "hero-sheet-storage",
    "dev": "hero-sheet-storage-dev"
  }[deployment];
  return result;
}


/*
 * Given a user (or email) string, this returns the folder that user (or email) is
 * stored in.
 */
const getFolderName = function(user) {
  return user; // FIXME: Later, this should invoke user.toLowerCase() so it can be case insensitive
}


async function invalidEndpoint(event, deployment) {
  console.log("invoked invalidEndpoint");
  return {
    statusCode: 404,
    body: JSON.stringify("Invalid endpoint.")
  };
}


async function optionsEndpoint(event, deployment) {
  console.log("invoked optionsEndpoint");
  return {
    statusCode: 200,
    body: ""
  }
}


/*
 * Reads and returns the user sessions for this user. It is a list of
 * entries, each of which has a sessionId and an expirationDate. In
 * case of any errors reading this file it just assumes that there
 * are NOT valid sessions, which is safe because the harm is simply to
 * force the user to log in.
 *
 * FIXME: this requires an extra read for nearly every operation. For
 *  efficiency's sake, we should probably maintain a bounded LRU cache
 *  of values in memory (across invocations by storing it in a global).
 *  If so, the cache should NOT be used for login. It should be used
 *  for validating session if the sessionId is found, but if the
 *  sessionId is NOT found then we should read the file anyway just
 *  in case it was updated by a different lambda VM.
 */
async function readUserSessions(deployment, user) {
  const folderName = getFolderName(user);
  const userSessionsFilename = `mutants/users/${folderName}/userSessions.json`;
  try {
    const response = await s3.getObject({
      Bucket: getBucket(deployment),
      Key: userSessionsFilename
    }).promise();
    return JSON.parse(response.Body);
  } catch(err) {
    console.log(`Error reading user sessions for ${user}: ${err}. Will assume no valid sessions.`);
    return [];
  }
}


async function writeUserSessions(deployment, user, userSessions) {
  const folderName = getFolderName(user);
  const userSessionsFilename = `mutants/users/${folderName}/userSessions.json`;
  await s3.putObject({
    Bucket: getBucket(deployment),
    Key: userSessionsFilename,
    Body: JSON.stringify(userSessions)
  }).promise();
}


/*
 * Call this to retrieve the data about a user. Returns null if the
 * given user does not exist. See writeUserInfo() for the structure of
 * a userInfo object. The input can be a user or an email -- if the
 * two are different then the files was stored under both names.
 */
async function readUserInfo(deployment, userOrEmail) {
  const folderName = getFolderName(userOrEmail);
  const userInfoFilename = `mutants/users/${folderName}/userInfo.json`;
  try {
    const response = await s3.getObject({
      Bucket: getBucket(deployment),
      Key: userInfoFilename
    }).promise();
    return JSON.parse(response.Body);
  } catch(err) {
    return null;
  }
}


/*
 * Call this to re-write the data about a user. User will either equal
 * email or have no "@" in it; email will either be a valid email or
 * will be null. If they are both strings and are different then we
 * will store the user info under BOTH.
 */
async function writeUserInfo(deployment, user, email, passwordSalt, passwordHash) {
  const dataObj = {
    user: user,
    email: email,
    passwordSalt: passwordSalt,
    passwordHash: passwordHash
  };
  const userFolderName = getFolderName(user);
  const userInfoFilename = `mutants/users/${userFolderName}/userInfo.json`;
  const response = await s3.putObject({
    Bucket: getBucket(deployment),
    Key: userInfoFilename,
    Body: JSON.stringify(dataObj)
  }).promise();
  if (email !== null) {
    const emailFolderName = getFolderName(email);
    const userInfoFilename2 = `mutants/users/${emailFolderName}/userInfo.json`;
    const response = await s3.putObject({
      Bucket: getBucket(deployment),
      Key: userInfoFilename2,
      Body: JSON.stringify(dataObj)
    }).promise();
  }
}


/*
 * Returns an expiration date for a sessionId which is generated or
 * refreshed now.
 */
function sessionExpirationDate() {
  const dateTime = new Date();
  dateTime.setDate(dateTime.getDate() + 14); // Exactly 2 weeks in the future
  return dateTime;
}


/*
 * This returns true if the sessionId is current and valid for that user; false
 * if it is not.
 *
 * FIXME: See notes on readUserSession for caching that is needed
 */
async function evaluateSessionId(deployment, user, sessionId, updateExpireDate=false) {
  const userSessions = await readUserSessions(deployment, user);
  const now = Date.now();
  const isValid = userSessions.some(x => x.sessionId === sessionId && new Date(x.expireDate) > now);
  if (updateExpireDate) {
    // --- Clear out expired sessions ---
    const currentUserSessions = userSessions.filter(
      x => x.expireDate <= now && x.sessionId !== sessionId
    );
    // --- Refresh the current one ---
    currentUserSessions.push({sessionId: sessionId, expireDate: sessionExpirationDate()});
    // --- Write it out ---
    await writeUserSessions(deployment, user, currentUserSessions);
  }
  return isValid;
}


/*
 * Finds the muffin value returns it as an object, or {} if it wasn't present.
 */
function parseMuffinHeader(event) {
  const muffin = event.headers.muffin;
  if (!muffin) {
    return {};
  } else {
    try {
      return JSON.parse(muffin);
    } catch(err) {
      console.log(`The muffin header was invalid. Value was "${muffin}".`);
      return {};
    }
  }
}


/*
 * Used a couple of places where we want to refresh (or set) the browser cookies.
 * Returns a value for multiValueHeaders.
 */
function sessionSetMuffinHeaders(user, sessionId) {
  return {
    "Set-Muffin": [ JSON.stringify({user: user, sessionId: sessionId})]
  };
}


async function restoreSessionEndpoint(event, deployment) {
  console.log("invoked restoreSessionEndpoint");

  // --- Get values from request ---
  const muffinFields = parseMuffinHeader(event);
  const muffinUser = muffinFields.user;
  const muffinSessionId = muffinFields.sessionId;

  // --- Verify sessionId is valid ---
  const sessionFound = await evaluateSessionId(deployment, muffinUser, muffinSessionId, true);
  const isValid = Boolean(muffinUser) && Boolean(muffinSessionId) && sessionFound;

  const responseBody = {
    "isValid": isValid,
    "user": muffinUser
  };
  return {
    statusCode: 200,
    body: JSON.stringify(responseBody)
  };
}


/*
 * Generate a random session ID.
 */
function newSessionId() {
  const number = crypto.randomBytes(2).readUInt16BE(0);
  return `s-${number}`;
}


const SALT_LEN = 64;
const KEY_LEN = 64;

/*
 * Given a new password, this generates a random salt and the hash from
 * scrypt, both of which should be stored for this user. It returns an
 * object with keys "salt" and "hash", each of which is an 88-character-long
 * base-64-encoded string.
 */
const encodePassword = async function(newPassword) {
  const salt = crypto.randomBytes(SALT_LEN);
  const hash = await new Promise((resolve, reject) =>
    crypto.scrypt(newPassword, salt, KEY_LEN, (err, hash) =>
      err ? reject(err) : resolve(hash)
    )
  );
  const result = {
    salt: salt.toString("base64"),
    hash: hash.toString("base64")
  };
  return result;
};

/*
 * Given a password used to log in and the salt and hash that were encoded
 * when the user created or updated their password, this returns true if
 * the password is correct and false if it is not.
 */
const testPassword = async function(loginPassword, salt, hash) {
  const saltBuffer = new Buffer(salt, "base64");
  const computedHash = await new Promise((resolve, reject) =>
    crypto.scrypt(loginPassword, saltBuffer, KEY_LEN, (err, hash) =>
      err ? reject(err) : resolve(hash)
    )
  );
  return computedHash.toString("base64") === hash;
};


/*
 * Do the things needed for a login and return the appropriate response
 * object. Pulled into a separate method because we need to share it
 * between loginEndpoint() and createUserEndpoint()
 */
async function createAndReturnSession(deployment, user) {
  // --- Read file of user sessions ---
  const userSessions = await readUserSessions(deployment, user);

  // --- Add new sessionId ---
  const sessionId = newSessionId();
  const expireDate = sessionExpirationDate();
  userSessions.push(
    {"sessionId": sessionId, "expireDate": expireDate.toISOString()}
  );

  // --- Write file of user sessions ---
  await writeUserSessions(deployment, user, userSessions);

  // --- Send response ---
  const responseObj = {loggedIn: true, user: user};
  return {
    statusCode: 200,
    multiValueHeaders: sessionSetMuffinHeaders(user, sessionId),
    body: JSON.stringify(responseObj)
  };
}


async function loginEndpoint(event, deployment) {
  console.log("invoked loginEndpoint");

  // --- Read parameters ---
  const userOrEmailOnPath = event.pathParameters.user;
  console.log(`Attempt to log in by "${userOrEmailOnPath}".`);
  let userOrEmailInBody, passwordInBody;
  try {
    const requestBody = JSON.parse(event.body);
    userOrEmailInBody = requestBody.userOrEmail;
    passwordInBody = requestBody.password;
  } catch(err) {
    return {
      statusCode: 400,
      body: JSON.stringify("Request Format Error")
    };
  }
  if (userOrEmailOnPath !== userOrEmailInBody) {
    return {
      statusCode: 400,
      body: JSON.stringify("Request Format Error")
    };
  }
  if (!(typeof passwordInBody === 'string' || passwordInBody instanceof String)) {
    return {
      statusCode: 400,
      body: JSON.stringify("Request Format Error")
    };
  }
  const userOrEmail = userOrEmailOnPath;
  const password = passwordInBody;

  // --- Get user info ---
  const userInfo = await readUserInfo(deployment, userOrEmail);
  if (userInfo === null) {
    console.log(`Login failed: "${userOrEmail}" is not a valid user or email.`);
    return {
      statusCode: 401,
      body: JSON.stringify("Login Failed") // don't tell the caller WHY it failed
    };
  }

  // --- Verify password --
  const passwordIsValid = await testPassword(password, userInfo.passwordSalt, userInfo.passwordHash);
  if (!passwordIsValid) {
    // --- Send response ---
    return {
      statusCode: 401,
      body: JSON.stringify("Login Failed")
    };
  }

  // --- If that password was right then we know the user ---
  const user = userInfo.user;
  console.log(`Successful Login by user "${user}"`);

  // --- Create the session and return it ---
  return await createAndReturnSession(deployment, user);
}


function validateUserCreateFields(user, email, password) {
  const fieldsValid = (
    new RegExp("^|[a-zA-Z0-9$@._+-]+$").test(user) &&
    !user.includes("..") &&
    new RegExp("^|[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$").test(email) &&
    new RegExp("^.{4,}$").test(password)
  );
  const hasUserOrEmail = user !== "" || email !== "";
  const onlyEmailsHaveAt = user === email || !user.includes("@");
  return fieldsValid && hasUserOrEmail && onlyEmailsHaveAt;
}


/*
 * Create a user. Three cases are allowed: a user, an email, or both. If
 * there is just an email, the user will be the same as the email or will
 * be blank and we will use the email. If there is just a user we use that
 * to store it. But if both are defined (and are different) then we store
 * TWO records - one under the email and one under the user.
 */
async function createUserEndpoint(event, deployment) {
  console.log("invoked createUserEndpoint");

  // --- Read values ---
  let user, email, password;
  try {
    const requestBody = JSON.parse(event.body);
    user = requestBody.user;
    email = requestBody.email;
    password = requestBody.password;
  } catch(err) {
    return {
      statusCode: 400,
      body: JSON.stringify("Request Format Error")
    };
  }

  // --- Perform server-side validation ---
  if (!validateUserCreateFields(user, email, password)) {
    return {
      statusCode: 400,
      body: JSON.stringify("Request Not Valid")
    };
  }

  // --- Determine values to be stored ---
  if (user === "") {
    user = email;
  }
  if (email === "") {
    email = null;
  }
  const encoded = await encodePassword(password);
  const passwordSalt = encoded.salt;
  const passwordHash = encoded.hash;

  // --- Verify user AND email both do not exist ---
  const existingUserInfoForUser = await readUserInfo(deployment, user);
  if (existingUserInfoForUser !== null) {
    return {
      statusCode: 409,
      body: JSON.stringify("Username Taken")
    };
  }
  if (email !== null) {
    const existingUserInfoForEmail = await readUserInfo(deployment, email);
    if (existingUserInfoForEmail !== null) {
      return {
        statusCode: 409,
        body: JSON.stringify("Email Taken")
      };
    }
  }

  // --- Create user ---
  await writeUserInfo(deployment, user, email, passwordSalt, passwordHash);

  // --- Do whatever loginEndpoint() would do ---
  return await createAndReturnSession(deployment, user);
}


class NotLoggedInError extends Error {
}

class InvalidDeploymentError extends Error {
}


/*
 * Endpoints that require the user to be logged in should call this. It will raise
 * a NotLoggedInError if the user is not correctly logged in; if they ARE correctly
 * logged in then it will return the user. It expects the claimed user to be in a
 * path parameter named "user".
 */
async function getLoggedInUser(event, deployment) {
  const claimedUser = event.pathParameters.user;
  const muffinFields = parseMuffinHeader(event);
  const muffinUser = muffinFields.user;
  const muffinSessionid = muffinFields.sessionId;
  if (claimedUser === muffinUser) {
    const sessionIsValid = await evaluateSessionId(deployment, claimedUser, muffinSessionid);
    if (sessionIsValid) {
      return claimedUser;
    }
  }
  throw new NotLoggedInError(`Not Logged In - the user ${claimedUser} is not properly logged in.`);
}


/*
 * Rebuilds the index.json file. Can throw an exception. It
 * returns the number of characters.
 */
async function rebuildIndex(deployment, user) {
  const folderName = getFolderName(user);
  const params = {
    Bucket: getBucket(deployment),
    Prefix: `mutants/users/${folderName}/characters/`
  };
  const listResult = await s3.listObjects(params).promise();
  if (listResult.IsTruncated) {
    throw new Error("Too many results.");
  }
  const loadableFilenames = [];
  for (const character of listResult.Contents) {
    if (character.Key === params.Prefix) {
      // Ignore this one; it's the directory
      continue;
    }
    console.log("Listing", character.Key);
    loadableFilenames.push(character.Key);
  }
  const fileFindings = await Promise.all(loadableFilenames.map(async key => {
    const fileResult = await s3.getObject({
      Bucket: getBucket(deployment),
      Key: key
    }).promise();
    return {
      key: key,
      fileBody: JSON.parse(fileResult.Body.toString('utf-8'))
    };
  }));
  const listOfResults = fileFindings.map(fileFinding => {
    const key = fileFinding.key;
    const characterData = fileFinding.fileBody;
    return extractIndexInfo(key, characterData);
  });
  const indexContents = {
    characters: listOfResults
  };
  const indexAsString = JSON.stringify(indexContents, null, 2) + "\n";
  const writeTo = {
    Bucket: getBucket(deployment),
    Key: `mutants/users/${folderName}/index.json`,
    Body: indexAsString
  }
  await s3.putObject(writeTo).promise();
  return listOfResults.length;
}


async function listCharactersEndpoint(event, deployment) {
  console.log("invoked listCharactersEndpoint");
  const user = await getLoggedInUser(event, deployment);
  const folderName = getFolderName(user);
  const readFrom = {
    Bucket: getBucket(deployment),
    Key: `mutants/users/${folderName}/index.json`
  };
  let file;
  try {
    file = await s3.getObject(readFrom).promise();
  } catch(err) {
    console.error(`For user "${user}", could not read index.json. Will regenerate.`);
    await rebuildIndex(deployment, user);
    try {
      file = await s3.getObject(readFrom).promise();
    } catch(err2) {
      console.error(`For user "${user}", rebuilding index.json did not help.`);
      return {
        statusCode: 500,
        body: JSON.stringify("Could not read index.json.")
      };
    }
  }
  return {
    statusCode: 200,
    body: file.Body.toString('utf-8')
  };
}


function createCharacterId() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const length = 8;
  let id = 'CH';
  for (let i = 0; i < length; i++) {
    // FIXME: Maybe use better random numbers even though it is not required
    id += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return id;
}



/*
 * Given a key and the JSON containing the data for a character,
 * this creates the JSON that we will store in the index for that
 * character.
 */
function extractIndexInfo(key, characterData) {
  let campaign;
  try {
    campaign = characterData.campaign.setting || "";
  } catch(err) {
    campaign = "";
  }
  let name;
  try {
    name = characterData.naming.name || "";
  } catch(err) {
    name = "";
  }
  return {
    key,
    campaign,
    name
  };
}

/*
 * This will update the index.json file for the user by modifying a
 * single record. Provide the user, the key for the character (that's
 * the whole path), and the characterData in JSON form. To delete a
 * record from the index, pass null for the characterData.
 */
async function updateRecordInIndex(deployment, user, characterKey, characterData) {
  console.log("invoked updateRecordInIndex");
  const folderName = getFolderName(user);
  const filename = `mutants/users/${folderName}/index.json`;
  let currentFile;
  try {
    currentFile = await s3.getObject({
      Bucket: getBucket(deployment),
      Key: filename
    }).promise();
  } catch(err) {
    console.error(`Could not read index.json for user "${user}". Will not update it.`);
    return;
  }
  const currentFileAsString = currentFile.Body.toString('utf-8');
  const fileAsJSON = JSON.parse(currentFileAsString);
  const currentCharacters = fileAsJSON.characters;
  const newCharacters = currentCharacters.map(character => {
    return character.key === characterKey ? null: character;
  });
  if (characterData !== null) {
    newCharacters.push(extractIndexInfo(characterKey, characterData));
  }
  fileAsJSON.characters = newCharacters.filter(x => x !== null);
  const newFileAsString = JSON.stringify(fileAsJSON, null, 2) + "\n";
  const writeTo = {
    Bucket: getBucket(deployment),
    Key: filename,
    Body: newFileAsString
  }
  await s3.putObject(writeTo).promise();
}


async function createCharacterEndpoint(event, deployment) {
  console.log("invoked createCharacterEndpoint");
  const user = await getLoggedInUser(event, deployment);
  validateSchema(JSON.parse(event.body));
  const characterId = createCharacterId();
  console.log(`new character ID: ${characterId} for user ${user}`);
  const folderName = getFolderName(user);
  const filename = `mutants/users/${folderName}/characters/${characterId}.json`;
  try {
    const writeTo = {
      Bucket: getBucket(deployment),
      Key: filename,
      Body: event.body
    };
    await s3.putObject(writeTo).promise();
    const characterData = JSON.parse(event.body.toString("utf-8"));
    await updateRecordInIndex(deployment, user, filename, characterData);
    const responseBody = {
      characterId: characterId
    };
    return {
      statusCode: 200,
      body: JSON.stringify(responseBody)
    };
  } catch(err) {
    return {
      statusCode: 500,
      body: JSON.stringify("Could not save.")
    };
  }
}


async function getCharacterEndpoint(event, deployment) {
  console.log("invoked getCharacterEndpoint");
  const user = await getLoggedInUser(event, deployment);
  const folderName = getFolderName(user);
  const characterId = event.pathParameters.characterId;
  const filename = `mutants/users/${folderName}/characters/${characterId}.json`;
  const file = await s3.getObject({
    Bucket: getBucket(deployment),
    Key: filename
  }).promise();
  const responseBody = file.Body.toString('utf-8');
  return {
    statusCode: 200,
    body: responseBody
  };
}


async function putCharacterEndpoint(event, deployment) {
  console.log("invoked putCharacterEndpoint");
  const user = await getLoggedInUser(event, deployment);
  validateSchema(JSON.parse(event.body));
  const folderName = getFolderName(user);
  const characterId = event.pathParameters.characterId;
  const filename = `mutants/users/${folderName}/characters/${characterId}.json`;
  try {
    const writeTo = {
      Bucket: getBucket(deployment),
      Key: filename,
      Body: event.body
    };
    await s3.putObject(writeTo).promise();
    const characterData = JSON.parse(event.body.toString("utf-8"));
    await updateRecordInIndex(deployment, user, filename, characterData);
    return {
      statusCode: 200,
      body: JSON.stringify("Success")
    };
  } catch(err) {
    return {
      statusCode: 500,
      body: JSON.stringify("Could not save.")
    };
  }
}


async function deleteCharacterEndpoint(event, deployment) {
  console.log("invoked deleteCharacterEndpoint");
  const user = await getLoggedInUser(event, deployment);
  const folderName = getFolderName(user);
  const characterId = event.pathParameters.characterId;
  const filename = `mutants/users/${folderName}/characters/${characterId}.json`;
  try {
    const file = await s3.deleteObject({ // FIXME: Should I be checking the return code?
      Bucket: getBucket(deployment),
      Key: filename
    }).promise();
    await updateRecordInIndex(deployment, user, filename, null);
    return {
      statusCode: 200,
      body: JSON.stringify(`Deleted ${characterId}`)
    };
  } catch(err) {
    return {
      statusCode: 500,
      body: JSON.stringify(`Could not delete ${characterId}.`)
    };
  }
}


async function rebuildIndexEndpoint(event, deployment) {
  console.log("invoked rebuildIndexEndpoint");
  const user = event.pathParameters.user;
  try {
    const numberOfCharacters = await rebuildIndex(deployment, user);
    return {
      statusCode: 200,
      body: JSON.stringify(`Rebuilt index for ${user} with ${numberOfCharacters} characters.`)
    }
  } catch(err) {
    console.log("Had error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify("Error rebuilding index.")
    };
  }
}


const DEPLOYMENTS = {
  "/hero-sheet": "prod",
  "/hero-sheet-dev": "dev",
};


// In addition to this, any OPTIONS request will get optionsEndpoint and anything
// not found will get invalidEndpoint.
const ROUTING = {
  "/restore-session": {
    "GET": restoreSessionEndpoint
  },
  "/users/{user}/login": {
    "POST": loginEndpoint
  },
  "/users": {
    "POST": createUserEndpoint,
  },
  "/users/{user}/characters": {
    "GET": listCharactersEndpoint,
    "POST": createCharacterEndpoint
  },
  "/users/{user}/characters/{characterId}": {
    "GET": getCharacterEndpoint,
    "PUT": putCharacterEndpoint,
    "DELETE": deleteCharacterEndpoint
  },
  "/users/{user}/rebuild-index": {
    "POST": rebuildIndexEndpoint
  }
};


exports.handler = async (event) => {
  // --- Initial Logging ---
  console.log("hero-sheet-storage is running.");
  if (LOG_REQUESTS) {
    console.log(`hero-sheet-storage received event ${JSON.stringify(event)}`);
  }

  // --- Dispatch to endpoint function ---
  let response = null;
  try {
    const invoked = {
      resourcePath: event.requestContext.resourcePath,
      httpMethod: event.requestContext.httpMethod
    };

    // --- Identify Deployment ---
    const getRoutePath = function(resourcePath) {
      for (const deploymentPrefix in DEPLOYMENTS) {
        if (invoked.resourcePath.startsWith(deploymentPrefix + "/")) {
          const deployment = DEPLOYMENTS[deploymentPrefix];
          console.log(`Deployment = ${deployment}`);
          return [deployment, resourcePath.substring(deploymentPrefix.length)];
        }
      }
      throw new InvalidDeploymentError();
    };
    const [deployment, routePath] = getRoutePath(invoked.resourcePath);

    // --- Routing ---
    const endpointFunction =
      routePath in ROUTING
        ? invoked.httpMethod in ROUTING[routePath]
        ? ROUTING[routePath][invoked.httpMethod]
        : invoked.httpMethod === "OPTIONS"
          ? optionsEndpoint
          : invalidEndpoint
        : invalidEndpoint;

    // --- Call endpoint function ---
    response = await endpointFunction(event, deployment);

  } catch(err) {
    // --- Return error response ---
    if (err instanceof NotLoggedInError) {
      // --- Permissions Error ---
      console.log("Returning 401 error (Not Logged In).");
      response = {
        statusCode: 401,
        body: JSON.stringify("Not Logged In")
      };
    } else if (err instanceof InvalidDeploymentError) {
      // --- Invalid Deployment Error ---
      console.log("Returning 404 error (Not a valid deployment).");
      response = {
        statusCode: 404,
        body: JSON.stringify("Not Found")
      };
    } else {
      // --- Unexpected Error ---
      console.log("Returning 500 error due to:", err);
      response = {
        statusCode: 500,
        body: JSON.stringify(err.toString())
      };
    }
  }

  // --- Add CORS headers ---
  const allowedOrigins = ["https://hero-sheet.com"];
  if (DEVELOPER_MODE) {
    allowedOrigins.push("http://localhost:8080");
  }
  const originProvided = event.headers.origin;
  const allowedOrigin = allowedOrigins.includes(originProvided) ? originProvided : "";
  if (response.headers === undefined) {
    response.headers = {};
  }
  response.headers["Access-Control-Allow-Origin"] = allowedOrigin;
  response.headers["Access-Control-Allow-Headers"] = "muffin,content-type";
  response.headers["Access-Control-Expose-Headers"] = "set-muffin";
  response.headers["Access-Control-Allow-Methods"] = "GET, HEAD, POST, PUT, DELETE, CONNECT, OPTIONS, TRACE, PATCH";
  // FIXME: Can I restore this? Later, after the code has settled down?
  //response.headers["Access-Control-Max-Age"] = 3600; // no pre-flight needed for 1 hour

  // --- Return Response ---
  console.log("Response", response);
  return response;
};

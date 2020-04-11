const LOG_REQUESTS = true;
const DEVELOPER_MODE = true;

const AWS = require('aws-sdk');
const s3 = new AWS.S3();

async function invalidEndpoint(event) {
  console.log("invoked invalidEndpoint");
  return {
    statusCode: 404,
    body: JSON.stringify("Invalid endpoint.")
  };
}


async function optionsEndpoint(event) {
  console.log("invoked optionsEndpoint");
  return {
    statusCode: 200,
    body: ""
  }
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
function sessionSetMuffinHeaders(user, sessionid) {
  return {
    "Set-Muffin": [ JSON.stringify({user: user, sessionid: sessionid})]
  };
}


async function restoreSessionEndpoint(event) {
  console.log("invoked restoreSessionEndpoint");

  const muffinFields = parseMuffinHeader(event);
  const user = muffinFields.user;
  const sessionid = muffinFields.sessionid;
  // FIXME: Here we should VERIFY that it is a valid sessionid.
  const isValid = Boolean(user && sessionid);
  console.log(`isValid = ${isValid} which comes from '${user}' and '${sessionid}'`); // FIXME: Remove

  const responseBody = {
    "isValid": isValid,
    "user": user
  };
  return {
    statusCode: 200,
    body: JSON.stringify(responseBody)
  }
}


async function loginEndpoint(event) {
  console.log("invoked loginEndpoint");
  // FIXME: Here we should VERIFY the password, then generate and STORE the sessionid.
  const user = event.pathParameters.user;
  const sessionid = "s-8374855"; // FIXME: Don't hard-code this
  return {
    statusCode: 200,
    multiValueHeaders: sessionSetMuffinHeaders(user, sessionid),
    body: JSON.stringify("Success")
  }
}


async function createUserEndpoint(event) {
  console.log("invoked createUserEndpoint");
  return {
    statusCode: 200,
    body: JSON.stringify("Success")
  };
}


/*
 * Endpoints that require the user to be logged in should call this. It will raise
 * a NotLoggedInError if the user is not correctly logged in; if they ARE correctly
 * logged in then it will return the user. It expects the claimed user to be in a
 * path parameter named "user".
 */
async function getLoggedInUser(event) {
  const claimedUser = event.pathParameters.user;
  const muffinFields = parseMuffinHeader(event);
  const muffinUser = muffinFields.user;
  const muffinSessionid = muffinFields.sessionid;
  console.log(`in getLoggedInUser have '${claimedUser}', '${muffinUser}' and '${muffinSessionid}'.`); // FIXME: Remove
  if (claimedUser === muffinUser) {
    // FIXME: Here we should VERIFY the sessionid is valid for that user
    if (muffinSessionid === "s-8374855") {
      return claimedUser;
    }
  }
  throw new Error(`Not Logged In - the user ${claimedUser} is not properly logged in.`);
}


// FIXME: This function isn't actually in use for anything
async function getUserEndpoint(event) {
  console.log("invoked getUserEndpoint");
  const user = await getLoggedInUser(event);
  const result = {
    username: user
  };
  return {
    statusCode: 200,
    body: JSON.stringify(result)
  };
}


// FIXME: Right now if any character is invalid this crashes. Instead, it should log the problem and return the rest of them.
async function listCharactersEndpoint(event) {
  console.log("invoked listCharactersEndpoint");
  const user = await getLoggedInUser(event);
  try {
    const params = {
      Bucket: "hero-sheet-storage",
      Prefix: `mutants/users/${user}/characters/`
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
      // FIXME: Reading every file isn't efficient if the sizes get big.
      // FIXME: For now it will do, but I may need to improve it later.
      console.log("Listing", character.Key);
      loadableFilenames.push(character.Key);
    }
    const fileFindings = await Promise.all(loadableFilenames.map(async key => {
      const fileResult = await s3.getObject({
        Bucket: "hero-sheet-storage",
        Key: key
      }).promise();
      return {
        key: key,
        fileBody: JSON.parse(fileResult.Body.toString('utf-8'))
      };
    }));
    const listOfResults = fileFindings.map(fileFinding => {
      const key = fileFinding.key;
      let campaign = "";
      try {
        campaign = fileFinding.fileBody.campaign.setting || "";
      } catch(err) {
        campaign = "";
      }
      let name = "";
      try {
        name = fileFinding.fileBody.naming.name || "";
      } catch(err) {
        name = "";
      }
      return {
        key,
        campaign,
        name
      };
    });
    const resultBody = {
      characters: listOfResults
    };
    return {
      statusCode: 200,
      body: JSON.stringify(resultBody)
    };
  } catch(err) {
    console.log("Had error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify("Error listing files.")
    };
  }
}


function createCharacterId() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const length = 8;
  let id = 'CH';
  for (let i = 0; i < length; i++) {
    id += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return id;
}


async function createCharacterEndpoint(event) {
  console.log("invoked createCharacterEndpoint");
  const user = await getLoggedInUser(event);
  const characterId = createCharacterId();
  const filename = `mutants/users/${user}/characters/${characterId}.json`;
  try {
    const writeTo = {
      Bucket: "hero-sheet-storage",
      Key: filename,
      Body: event.body
    };
    await s3.putObject(writeTo).promise();
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


async function getCharacterEndpoint(event) {
  console.log("invoked getCharacterEndpoint");
  const user = await getLoggedInUser(event);
  const characterId = event.pathParameters.characterId;
  const filename = `mutants/users/${user}/characters/${characterId}.json`;
  const file = await s3.getObject({
    Bucket: "hero-sheet-storage",
    Key: filename
  }).promise();
  const responseBody = file.Body.toString('utf-8');
  return {
    statusCode: 200,
    body: responseBody
  };
}


async function putCharacterEndpoint(event) {
  console.log("invoked putCharacterEndpoint");
  const user = await getLoggedInUser(event);
  const characterId = event.pathParameters.characterId;
  const filename = `mutants/users/${user}/characters/${characterId}.json`;
  // FIXME: I should verify that the user and character exist before writing!
  try {
    const writeTo = {
      Bucket: "hero-sheet-storage",
      Key: filename,
      Body: event.body
    };
    await s3.putObject(writeTo).promise();
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


async function deleteCharacterEndpoint(event) {
  console.log("invoked deleteCharacterEndpoint");
  const user = await getLoggedInUser(event);
  const characterId = event.pathParameters.characterId;
  const filename = `mutants/users/${user}/characters/${characterId}.json`;
  try {
    const file = await s3.deleteObject({
      Bucket: "hero-sheet-storage",
      Key: filename
    }).promise();
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


// In addition to this, any OPTIONS request will get optionsEndpoint and anything
// not found will get invalidEndpoint.
const ROUTING = {
  "/hero-sheet/restore-session": {
    "GET": restoreSessionEndpoint
  },
  "/hero-sheet/users/{user}/login": {
    "POST": loginEndpoint
  },
  "/hero-sheet/users": {
    "POST": createUserEndpoint,
  },
  "/hero-sheet/users/{user}": {
    "GET": getUserEndpoint
  },
  "/hero-sheet/users/{user}/characters": {
    "GET": listCharactersEndpoint,
    "POST": createCharacterEndpoint
  },
  "/hero-sheet/users/{user}/characters/{characterId}": {
    "GET": getCharacterEndpoint,
    "PUT": putCharacterEndpoint,
    "DELETE": deleteCharacterEndpoint
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

    // --- Routing ---
    const endpointFunction =
      invoked.resourcePath in ROUTING
        ? invoked.httpMethod in ROUTING[invoked.resourcePath]
          ? ROUTING[invoked.resourcePath][invoked.httpMethod]
          : invoked.httpMethod === "OPTIONS"
            ? optionsEndpoint
            : invalidEndpoint
        : invalidEndpoint;

    // --- Call endpoint function ---
    response = await endpointFunction(event);

  } catch(err) {
    // --- Return error response ---
    console.log("Had error", err);
    response = {
      statusCode: 500,
      body: JSON.stringify(err.toString())
    };
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

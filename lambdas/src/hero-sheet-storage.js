const AWS = require('aws-sdk');
const s3 = new AWS.S3();

async function invalidEndpoint(pathParameters, body) {
  console.log("invoked invalidEndpoint");
  return {
    statusCode: 404,
    body: JSON.stringify("Invalid endpoint.")
  }
}


async function getCharacterEndpoint(pathParameters, body) {
  console.log("invoked getCharacterEndpoint");
  const user = pathParameters.user;
  const characterId = pathParameters.characterId;
  const filename = `mutants/users/${user}/characters/${characterId}.json`;
  const file = await s3.getObject({
    Bucket: "hero-sheet-storage",
    Key: filename
  }).promise();
  const responseBody = file.Body.toString('utf-8');
  return {
    statusCode: 200,
    body: responseBody
  }
}


async function putCharacterEndpoint(pathParameters, body) {
  console.log("invoked putCharacterEndpoint");
  const user = pathParameters.user;
  const characterId = pathParameters.characterId;
  const filename = `mutants/users/${user}/characters/${characterId}.json`;
  // FIXME: I should verify that the user and character exist before writing!
  try {
    const writeTo = {
      Bucket: "hero-sheet-storage",
      Key: filename,
      Body: body
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
    }
  }
}


async function listCharactersEndpoint(pathParameters, body) {
  console.log("invoked listCharactersEndpoint");
  const user = pathParameters.user;
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
      loadableFilenames.push(character.Key)
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



exports.handler = async (event) => {
  console.log("hero-sheet-storage is running.");
  let response = null;
  try {
    const invoked = {
      resourcePath: event.requestContext.resourcePath,
      httpMethod: event.requestContext.httpMethod
    };
    let endpointFunction = null;
    if (invoked.resourcePath === "/hero-sheet/users/{user}/characters") {
      if (invoked.httpMethod === "GET") {
        endpointFunction = listCharactersEndpoint;
      } else {
        endpointFunction = invalidEndpoint;
      }
    } else if (invoked.resourcePath === "/hero-sheet/users/{user}/characters/{characterId}") {
      if (invoked.httpMethod === "GET") {
        endpointFunction = getCharacterEndpoint;
      } else if (invoked.httpMethod === "PUT") {
        endpointFunction = putCharacterEndpoint;
      } else {
        endpointFunction = invalidEndpoint;
      }
    } else {
      endpointFunction = invalidEndpoint;
    }
    response = await endpointFunction(event.pathParameters, event.body);
  } catch(err) {
    console.log("Had error", err);
    response = {
      statusCode: 500,
      body: JSON.stringify(err.toString())
    }
  }
  // Add CORS headers
  response.headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
    "Access-Control-Allow-Credentials": true
  }
  console.log("Response", response);
  return response;
};

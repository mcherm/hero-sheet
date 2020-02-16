const AWS = require('aws-sdk');
const s3 = new AWS.S3();

async function invalidEndpoint(pathParameters, body) {
  return {
    statusCode: 404,
    body: JSON.stringify("Invalid endpoint.")
  }
}


async function getCharacterEndpoint(pathParameters, body) {
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



exports.handler = async (event) => {
  console.log("hero-sheet-storage is running.");
  const invoked = {
    resourcePath: event.requestContext.resourcePath,
    httpMethod: event.requestContext.httpMethod
  };
  let endpointFunction = null;
  if (invoked.resourcePath === "/hero-sheet/users/{user}/characters/{characterId}") {
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
  const response = await endpointFunction(event.pathParameters, event.body);
  // Add CORS headers
  response.headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
    "Access-Control-Allow-Credentials": true
  }
  return response;
};

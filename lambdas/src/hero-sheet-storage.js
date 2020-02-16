const AWS = require('aws-sdk');
const s3 = new AWS.S3();

exports.handler = async (event) => {
  console.log("hero-sheet-storage is running.");
  const user = event.pathParameters.user;
  const characterId = event.pathParameters.characterId;
  const filename = `mutants/users/${user}/characters/${characterId}.json`;
  const file = await s3
    .getObject({
      Bucket: "hero-sheet-storage",
      Key: filename
    })
    .promise();
  const resultBody = file.Body.toString('utf-8');
  const response = {
    statusCode: 200,
    body: resultBody,
    headers: {
      "Access-Control-Allow-Origin": "*", // Required for CORS support to work
      "Access-Control-Allow-Credentials": true // Required for cookies, authorization headers with HTTPS
    },
  };
  return response;
};

//
// Code for making API calls
//

const FIXED_URL_PREFIX = "https://u3qr0bfjmc.execute-api.us-east-1.amazonaws.com/prod/";

let deployment = "prod"; // defaults to the production environment

function setDeployment(newDeployment) {
  deployment = newDeployment;
}

function getMuffin() {
  const muffin = localStorage.getItem("muffin");
  if (muffin) {
    return muffin;
  } else {
    return null;
  }
}


class APIError extends Error {
}

class NotLoggedInError extends Error {
}


/*
 * Common code for performing the API call. It
 */
async function performAPICall(path, verb, taskDescription, bodyObj=null, prettyPrint=false) {
  try {
    const deploymentArgument = {
      "prod": "hero-sheet",
      "dev": "hero-sheet-dev",
    }[deployment];
    const url = FIXED_URL_PREFIX + deploymentArgument + path;
    const headers = {
    };
    const muffin = getMuffin();
    if (muffin) {
      headers["muffin"] = muffin;
    }
    if (bodyObj !== null) {
      headers["Content-Type"] = "application/json";
    }
    const settings = {
      method: verb,
      headers: headers,
      mode: "cors"
    };
    if (bodyObj !== null) {
      const bodyStr = prettyPrint
        ? JSON.stringify(bodyObj, null, 2) + "\n"
        : JSON.stringify(bodyObj);
      settings.body = bodyStr;
    }
    const response = await fetch(url, settings);
    if (response.status === 401) {
      throw new NotLoggedInError(`Not logged in when attempting to ${taskDescription}.`);
    } else  if (response.status !== 200) {
      throw new APIError(`API call failed with error code ${response.status} when attempting to ${taskDescription}.`);
    }
    if (response.headers.has("set-muffin")) {
      localStorage.setItem("muffin", response.headers.get("set-muffin"));
    }
    return await response.json();
  } catch(err) {
    if (err instanceof NotLoggedInError) {
      throw err;
    } else if (err instanceof APIError) {
      throw err;
    } else {
      throw new APIError(`Error attempting to ${taskDescription}: ${err}`);
    }
  }
}


async function requestPasswordReset(email) {
  const path = `/request-password-reset`;
  const bodyObj = {email};
  return await performAPICall(path, "POST", "request password reset", bodyObj);
}

async function restoreSession() {
  const path = `/restore-session`;
  return await performAPICall(path, "GET", "restore session");
}


async function endSession() {
  localStorage.removeItem("muffin");
}


async function listCharacters(user) {
  const path = `/users/${user}/characters`;
  return await performAPICall(path, "GET", "list characters");
}

async function listPublicCharacters(user) {
  const path = `/users/${user}/public-characters`;
  return await performAPICall(path, "GET", "list public characters");
}

async function getCharacter(user, characterId) {
  const path = `/users/${user}/characters/${characterId}`;
  return await performAPICall(path, "GET", "load character");
}


async function saveCharacter(user, characterId, charsheet) {
  const path = `/users/${user}/characters/${characterId}`;
  await performAPICall(path, "PUT", "save character", charsheet, true);
}


async function createCharacter(user, character) {
  const path = `/users/${user}/characters`;
  return await performAPICall(path, "POST", "create character", character, true);
}


async function deleteCharacter(user, characterId) {
  const path = `/users/${user}/characters/${characterId}`;
  await performAPICall(path, "DELETE", "delete character");
}


async function login(userOrEmail, password) {
  const path = `/users/${userOrEmail}/login`;
  const bodyObj = {userOrEmail: userOrEmail, password: password};
  return await performAPICall(path, "POST", "log in", bodyObj);
}


async function createUser(user, email, password) {
  const path = `/users`;
  const bodyObj = {user: user, email: email, password: password};
  return await performAPICall(path, "POST", "create user", bodyObj);
}

async function rebuildIndex(user) {
  const path = `/users/${user}/rebuild-index`;
  const bodyObj = {value: "warthog"};
  return await performAPICall(path, "POST", "rebuild index", bodyObj);
}

async function resetPassword(user, authToken, newPassword) {
  const path = `/users/${user}/reset-password`
  const bodyObj = {authToken, newPassword};
  return await performAPICall(path, "POST", "reset password", bodyObj);
}

async function getViewing(user) {
  const path = `/users/${user}/viewing`;
  return await performAPICall(path, "GET", "list users being viewed");
}

export {
  setDeployment,
  APIError,
  NotLoggedInError,
  requestPasswordReset,
  restoreSession,
  endSession,
  listCharacters,
  listPublicCharacters,
  getCharacter,
  saveCharacter,
  createCharacter,
  deleteCharacter,
  login,
  createUser,
  rebuildIndex,
  resetPassword,
  getViewing,
};

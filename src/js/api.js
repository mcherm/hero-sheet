//
// Code for making API calls
//

const FIXED_URL_PREFIX = "https://u3qr0bfjmc.execute-api.us-east-1.amazonaws.com/prod/hero-sheet";

// FIXME: Needs to handle expiration
function getMuffin() {
  const muffin = localStorage.getItem("muffin");
  if (muffin) {
    console.log(`getMuffin returning ${muffin}`);
    return muffin;
  } else {
    return null;
  }
}

class APIError extends Error {
}

/*
 * Common code for performing the API call. It
 */
async function performAPICall(path, verb, taskDescription, bodyObj=null, prettyPrint=false) {
  try {
    const url = FIXED_URL_PREFIX + path;
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
    console.log(` before call, settings = ${JSON.stringify(settings)}`); // FIXME: Remove
    const response = await fetch(url, settings);
    if (response.status !== 200) {
      throw new APIError(`API call failed with error code ${response.status}`);
    }
    if (response.headers.has("set-muffin")) {
      localStorage.setItem("muffin", response.headers.get("set-muffin"));
    }
    return await response.json();
  } catch(err) {
    throw new APIError(`Error attempting to ${taskDescription}: ${err}`);
  }
}



async function restoreSession() {
  const path = `/restore-session`;
  return await performAPICall(path, "GET");
}


async function listCharacters(user) {
  const path = `/users/${user}/characters`;
  return await performAPICall(path, "GET");
}


async function getCharacter(user, characterId) {
  const path = `/users/${user}/characters/${characterId}`;
  return await performAPICall(path, "GET");
}


async function saveCharacter(user, characterId, charsheet) {
  const path = `/users/${user}/characters/${characterId}`;
  await performAPICall(path, "PUT", "save", charsheet, true);
}


async function createCharacter(user, character) {
  const path = `/users/${user}/characters`;
  return await performAPICall(path, "POST", "create character", character, true);
}


// FIXME: Maybe move the try-catch inside of performAPICall
async function deleteCharacter(user, characterId) {
  const path = `/users/${user}/characters/${characterId}`;
  await performAPICall(path, "DELETE", "delete character");
}


async function login(user, password) {
  const path = `/users/${user}/login`;
  const bodyObj = {user: user, password: password};
  return await performAPICall(path, "POST", "log in", bodyObj);
}


export {
  APIError,
  restoreSession,
  listCharacters,
  getCharacter,
  saveCharacter,
  createCharacter,
  deleteCharacter,
  login,
};

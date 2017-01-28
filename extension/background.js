var config = {
  apiKey: "AIzaSyDnvUBcx27cvxpAneHWlMmc2tEtXGO93oI",
  authDomain: "newton-4b2cb.firebaseapp.com",
  databaseURL: "https://newton-4b2cb.firebaseio.com",
  storageBucket: "gs://newton-4b2cb.appspot.com"
};
firebase.initializeApp(config);

var rootRef = firebase.database().ref();
var flagsRef = rootRef.child("flags");
var usersRef = rootRef.child("users");

var user = null;

function startAuth() {
  console.log("startAuth called");
  // Request an OAuth token from the Chrome Identity API.
  chrome.identity.getAuthToken({interactive: false}, function(token) {
    console.log("got a token: ", token);
    if(chrome.runtime.lastError) {
      console.error(chrome.runtime.lastError);
    } else if (token) {
      // Authrorize Firebase with the OAuth Access Token.
      var credential = firebase.auth.GoogleAuthProvider.credential(null, token);
      console.log("credential = " + credential);
      firebase.auth().signInWithCredential(credential).catch(function(error) {
        // The OAuth token might have been invalidated. Lets' remove it from cache.
        if (error.code === 'auth/invalid-credential') {
          chrome.identity.removeCachedAuthToken({token: token}, function() {
            startAuth();
          });
        }
      });
    } else {
      console.error('The OAuth Token was null');
    }
  });
}

/**
 * Create a new flag
 */
function pushNewFlag(flag) {
  if (!user) {
    console.error("pushNewFlag called with no user!");
    return;
  }
  flag.createdAt = firebase.database.ServerValue.TIMESTAMP;

  var newFlagRef = flagsRef.push();
  var updateData = {};
  updateData["users/" + user.uid + "/flags/" + newFlagRef.key] = true;
  updateData["flags/" + newFlagRef.key] = flag;
  console.log("pushing: ", updateData);
  return rootRef.update(updateData);
}

/**
 * initApp handles setting up the Firebase context and registering
 * callbacks for the auth status.
 *
 * The core initialization is in firebase.App - this is the glue class
 * which stores configuration. We provide an app name here to allow
 * distinguishing multiple app instances.
 *
 * This method also registers a listener with firebase.auth().onAuthStateChanged.
 * This listener is called when the user is signed in or out, and that
 * is where we update the UI.
 *
 * When signed in, we also authenticate to the Firebase Realtime Database.
 */
function initApp() {
  console.log("initializing background");
  // Listen for auth state changes.
  firebase.auth().onAuthStateChanged(function(authData) {
    console.log('User state change detected from the Background script of the Chrome Extension:', authData);
    user = authData;
  });
  chrome.browserAction.onClicked.addListener(function(tab) {
    if (!user) {
      startAuth();
      return;
    }
  });

  console.log("creating newton-flag context menu item");
  chrome.contextMenus.create({
    id: "newton-flag",
    title: "Newton Flag",
    contexts: ["selection"],
    onclick: function (info, tab) {
      console.log("newton-flag context menu item clicked!", info, tab);
      console.log("the selection is:", tab.getSelection());
    }
  }, function () {
    console.log("done creating newton-flag");
    if (chrome.runtime.lastError) {
      console.log("hit an error:", chrome.runtime.lastError);
    }
  });
}

window.onload = function() {
  initApp();
};

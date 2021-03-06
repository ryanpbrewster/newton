var config = {
  apiKey: "AIzaSyDnvUBcx27cvxpAneHWlMmc2tEtXGO93oI",
  authDomain: "newton-4b2cb.firebaseapp.com",
  databaseURL: "https://newton-4b2cb.firebaseio.com",
  storageBucket: "gs://newton-4b2cb.appspot.com"
};
firebase.initializeApp(config);

var rootRef = firebase.database().ref();
var flagsRef = rootRef.child("flags");
var notesRef = rootRef.child("notes");
var usersRef = rootRef.child("users");
var urisRef = rootRef.child("uris");

var user = null;
var activeFlagKey = null;

function startAuth() {
  console.log("startAuth called");
  // Request an OAuth token from the Chrome Identity API.
  chrome.identity.getAuthToken({interactive: true}, function(token) {
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
  updateData["uris/" + btoa(flag.url, 64) + "/" + newFlagRef.key] = true;
  console.log("pushing: ", updateData);
  return rootRef.update(updateData);
}

/**
 * Create a new flag
 */
function pushNewNote(note) {
  if (!user) {
    console.error("pushNewNote called with no user!");
    return;
  }
  note.createdAt = firebase.database.ServerValue.TIMESTAMP;

  var newNoteRef = notesRef.child(note.flagKey).push();
  var updateData = {};
  updateData["users/" + user.uid + "/notes/" + newNoteRef.key] = true;
  updateData["notes/" + note.flagKey + "/" + newNoteRef.key] = note;
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
      console.log("newton-flag context menu item clicked!", info.selectionText);
      chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { action: "serializeSelection" }, function (response) {
          console.log("received response from tab: ", response);
          pushNewFlag({
            url: info.pageUrl,
            selection: response.selection,
            text: info.selectionText
          });
        });
      });
    }
  }, function () {
    console.log("done creating newton-flag");
    if (chrome.runtime.lastError) {
      console.log("hit an error:", chrome.runtime.lastError);
    }
  });

  console.log("adding webNavigation listener");
  chrome.webNavigation.onCompleted.addListener(function (info) {
    console.log("navigated to " + info.url + ", loading flags");
    urisRef.child(btoa(info.url, 64)).on("child_added", function (uriFlagSnap) {
      console.log("found flag: " + uriFlagSnap.key);
      flagsRef.child(uriFlagSnap.key).once("value", function (flagSnap) {
        console.log("flag " + flagSnap.key + " @ " + flagSnap.val().selection);
        chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
          chrome.tabs.sendMessage(tabs[0].id, { action: "registerFlag", key: flagSnap.key, flag: flagSnap.val() }, function (response) {
            console.log("response from registerFlag " + flagSnap.key + ":", response);
          });
        });
      });
    });
  });

  console.log("setting up listeners");
  chrome.runtime.onMessage.addListener(function (msg) {
    console.log("received message:", msg);
    switch (msg.action) {
      case "setActiveFlag":
        if (activeFlagKey) {
          notesRef.child(activeFlagKey).off("child_added");
        }
        activeFlagKey = msg.key;
        notesRef.child(activeFlagKey).on("child_added", function (noteSnap) {
          console.log("note: ", noteSnap.val());
          chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
            chrome.tabs.sendMessage(tabs[0].id, { action: "registerNote", key: noteSnap.key, note: noteSnap.val() }, function (response) {
              console.log("response from registerNote " + noteSnap.key + ":", response);
            });
          });
        });
        break;
      case "createNote":
        pushNewNote({
          text: msg.text,
          flagKey: activeFlagKey
        });
        break;
      default:
        console.error("could not recognize action: " + msg.action);
    }
  });
}

window.onload = function() {
  initApp();
};

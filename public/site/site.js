window.onload = function() {
  alert("Loaded Site");

  var main = document.getElementById("main");
  var googleProvider = new firebase.auth.GoogleAuthProvider();

  firebase.auth().onAuthStateChanged(function(authData) {
    if (authData) {
      initApp();
    } else {
      initLogin();
    }
  });

  function clearElement(e) {
    while (e.lastChild != null) {
      e.removeChild(e.lastChild);
    }
  }

  function initLogin() {
    clearElement(main);
    main.appendChild(signInButton());
  }

  function signInButton() {
    var signInButton = document.createElement("button");
    signInButton.id = "sign-in-button";
    signInButton.onclick = function(data) {
      firebase.auth().signInWithPopup(googleProvider);
    };

    var googleLogo = document.createElement("img");
    googleLogo.id = "google-logo";
    googleLogo.src = "https://www.gstatic.com/firebasejs/ui/0.5.0/images/auth/google.svg";
    signInButton.appendChild(googleLogo);

    var signInText = document.createElement("span");
    signInText.innerText = "Sign in with Google";
    signInButton.appendChild(signInText);

    return signInButton;
  }

  function initApp() {
    var user = firebase.auth().currentUser;
    var rootRef = firebase.database().ref();
    var userRef = rootRef.child("users").child(user.uid);

    if (user) {
      updateUserProfile();
    }

    clearElement(main);
    var signOutButton = document.createElement("button");
    signOutButton.id = "sign-out-button";
    signOutButton.innerText = "Sign Out";
    signOutButton.onclick = function(data) {
      firebase.auth().signOut();
    };
    main.appendChild(signOutButton);

    var foo = document.createElement("p");
    foo.innerText = "signed in user: " + firebase.auth().currentUser.displayName;
    main.appendChild(foo);

    var userAuthoredFlags = {
      data: {},
      element: document.createElement("ul"),
      update: function () {
        clearElement(userAuthoredFlags.element);
        Object.keys(userAuthoredFlags.data).sort().forEach(function (flagKey) {
          var flagItem = document.createElement("li");
          flagItem.innerText = flagKey;
          userAuthoredFlags.element.appendChild(flagItem);
        });
      }
    }
    main.appendChild(userAuthoredFlags.element);

    userRef.child("flags").on("child_added", function (flagSnap) {
      userAuthoredFlags.data[flagSnap.key] = flagSnap.val();
      userAuthoredFlags.update();
    });


    function updateUserProfile() {
      console.log("updating user profile for " + user.uid);
      rootRef.child("users").child(user.uid).child("profile").set({
        displayName: user.displayName
      });
    }
  }
}

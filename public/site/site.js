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
    var signInButton = document.createElement("button");
    signInButton.id = "sign-in-button";
    signInButton.innerText = "Sign In";
    signInButton.onclick = function(data) {
      firebase.auth().signInWithPopup(googleProvider);
    };
    main.appendChild(signInButton);
  }

  function initApp() {
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
  }
}

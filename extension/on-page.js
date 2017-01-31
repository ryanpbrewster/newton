console.log("loading content script!");
rangy.init();

var highlighter = rangy.createHighlighter();

var flagKeyByHighlightId = {};

var newtonNotePane = document.createElement("div");
newtonNotePane.id = "newton-note-pane";
newtonNotePane.addEventListener("click", function (clickEvent) {
  console.log("newton-note-pane clicked");
  clickEvent.stopPropagation();
  return false;
});
document.getElementsByTagName("body")[0].appendChild(newtonNotePane);

var newtonNoteInput = document.createElement("textarea");
newtonNoteInput.id = "newton-note-input";
newtonNoteInput.onkeypress = function (keyPressEvent) {
  if (keyPressEvent.keyCode === 13 && !keyPressEvent.shiftKey) {
    chrome.runtime.sendMessage({ "action": "createNote", "text": newtonNoteInput.value });
    newtonNoteInput.value = "";
    return false;
  }
};
newtonNotePane.appendChild(newtonNoteInput);

function clearNotePane() {
  while (newtonNotePane.firstChild !== newtonNoteInput) {
    newtonNotePane.removeChild(newtonNotePane.firstChild);
  }
}

document.getElementsByTagName("html")[0].addEventListener("click", function (event) {
  console.log("html clicked");
  newtonNotePane.style["display"] = "none";
});

highlighter.addClassApplier(rangy.createClassApplier("newton-flag", {
    ignoreWhiteSpace: true,
    elementTagName: "span",
    elementProperties: {
        onclick: function(clickEvent) {
            var h = highlighter.getHighlightForElement(this);
            console.log("Clicked on highlight " + h.id + " with flag " + flagKeyByHighlightId[h.id]);

            clearNotePane();
            newtonNotePane.style["display"] = "block";
            chrome.runtime.sendMessage({ "action": "setActiveFlag", "key": flagKeyByHighlightId[h.id] });

            clickEvent.stopPropagation();
            return false;
        }
    }
}));

chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
  console.log("sender = " + sender.id + ", my id = " + chrome.runtime.id);
  switch (msg.action) {
    case "serializeSelection":
      sendResponse({
        ok: true,
        selection: rangy.serializeSelection(rangy.getSelection(), true)
      });
      break;
    case "registerFlag":
      try {
        rangy.deserializeSelection(msg.flag.selection);
        var h = highlighter.highlightSelection("newton-flag")[0];
        flagKeyByHighlightId[h.id] = msg.key;
        sendResponse({
          ok: true
        });
      } catch(err) {
        console.error("could not deserialize flag " + msg.key);
        sendResponse({
          ok: false,
          err: err
        });
      }
      break;
    case "registerNote":
      console.log("note:", msg.note);
      var noteElement = document.createElement("p");
      noteElement.innerText = msg.note.text;
      newtonNotePane.insertBefore(noteElement, newtonNoteInput);
      sendResponse({
        ok: true
      });
      break;
    default:
      console.error("unrecognized action", msg);
      sendResponse({
        ok: false,
        error: "could not recognize action"
      });
  }
});

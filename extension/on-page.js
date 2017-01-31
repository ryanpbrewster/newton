console.log("loading content script!");
rangy.init();

var highlighter = rangy.createHighlighter();

var newtonThreadPane = document.createElement("div");
newtonThreadPane.id = "newton-thread-pane";
newtonThreadPane.addEventListener("click", function (clickEvent) {
  console.log("newton-thread-pane clicked");
  clickEvent.stopPropagation();
  return false;
});
document.getElementsByTagName("body")[0].appendChild(newtonThreadPane);

document.getElementsByTagName("html")[0].addEventListener("click", function (event) {
  console.log("html clicked");
  newtonThreadPane.style["display"] = "none";
});

highlighter.addClassApplier(rangy.createClassApplier("newton-flag", {
    ignoreWhiteSpace: true,
    elementTagName: "span",
    elementProperties: {
        onclick: function(clickEvent) {
            var highlight = highlighter.getHighlightForElement(this);
            console.log("Clicked on highlight " + highlight.id);
            newtonThreadPane.style["display"] = "block";
            clickEvent.stopPropagation();
            return false;
        }
    }
}));

chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
  console.log("sender = " + sender.id + ", my id = " + chrome.runtime.id);
  switch (msg.action) {
    case "create":
      sendResponse({
        ok: true,
        selection: rangy.serializeSelection(rangy.getSelection(), true)
      });
      break;
    case "apply":
      console.log("applying new highlight");
      rangy.deserializeSelection(msg.flag.selection);
      var h = highlighter.highlightSelection("newton-flag");
      console.log(h.id);
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

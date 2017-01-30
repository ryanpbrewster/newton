console.log("loading content script!");
rangy.init();
var highlighter = rangy.createHighlighter();

highlighter.addClassApplier(rangy.createClassApplier("newton-flag", {
    ignoreWhiteSpace: true,
    elementTagName: "span",
    elementProperties: {
        onclick: function() {
            var highlight = highlighter.getHighlightForElement(this);
            if (window.confirm("Delete this note (ID " + highlight.id + ")?")) {
                highlighter.removeHighlights( [highlight] );
            }
            return false;
        }
    }
}));

chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
  console.log("sender = " + sender.id + ", my id = " + chrome.runtime.id);
  switch (msg.action) {
    case "create":
      console.log("using current highlight");
      highlighter.highlightSelection("newton-flag");
      sendResponse({
        ok: true,
        selection: rangy.serializeSelection()
      });
      break;
    case "apply":
      console.log("applying new highlight");
      rangy.deserializeSelection(msg.selection);
      highlighter.highlightSelection("newton-flag");
      sendResponse({
        ok: true
      });
    default:
      sendResponse({
        ok: false,
        error: "could not recognize action"
      });
  }
});

chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
  console.log("received a message!", msg, sender);
  sendResponse({
    msg: msg,
    sender: sender,
    foo: rangy.getSelection().toString(),
    bar: rangy.serializeSelection()
  });
});

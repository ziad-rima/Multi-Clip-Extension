chrome.action.onClicked.addListener((tab) => {
    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["content.js"]
    });
});

chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "addToClipboard",
        title: "Add to MultiClip",
        contexts: ["selection"]
    });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "addToClipboard" && info.selectionText) {
        chrome.tabs.sendMessage(tab.id, {
            type: "ADD_TO_CLIPBOARD",
            text: info.selectionText
        });
    }
});


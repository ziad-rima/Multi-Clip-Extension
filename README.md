# Multiclip Extension

## What Are Browser Extensions?

- A browser extension is a **mini web app** that runs inside a browser. But unlike websites, it has **special permissions** and **access** to browser features.

### What Are Extensions Made Of? 

- At their core, browser extensions are made of:
    - **HTML**: For any visible parts (popups, injected UI).
    - **CSS**: To style those parts.
    - **JavaScript**: For logic and functionality.
    - **manifest.json**: The brain of the extension that tells the browser what it does and how.

## Key Components

- **manifest.json**: Declares everything: permissions, files, extension name, icons, etc. 

- **Content Script (content.js)**: Injected into websites. Used to place the floating clipboard window in webpages. 

- **Background Script (background.js)**: Runs in the background, doesn't touch the page. It manages stored data and listens for events. 

- **Popup UI (popup.html)**: Optional little window that appears when the user clicks the extension icon in the toolbar.

- **Storage APIs**: Used to save clipboard items (localStorage or chrome.storage.local).

- **Messaging System**: Lets content and background scripts talk to each other. 

### What is "Manifest v3"?

- MV3 is the **latest standard** that defines how Chrome extensions should be built. 
- So, **`manifest.json`** file acts as a blueprint of the extension. It tells the browser:
    - What the extension does,
    - Which files it uses,
    - What pages it can interact with,
    - And what permissions it needs.

- Manifest v3 now uses **services workers** instead of constantly running background scripts.
- This makes the extensions:
    - Use less memory,
    - Perform faster,
    - Behave more like modern web apps. 

### Why Must Permissions Be Declared?

- To protect users, every extension needs to clearly state what it will do.
- For exmaple:
    - If the extension needs to access websites -> we declare "`host_permissions`"
    - If it wants to use storage -> we declare "`storage`" 
    - If it wants to read clipboard -> we declare "`clipboardRead`"

## Building Process

- I started by creating the necessary files for this extension:
    - `background.js`
    - `content.js`
    - `manifest.json`
    - `popup.html`
    - `styles.css`

- And an `icons` folder.

- I started with `manifest.json`:
```json
{
    "manifest_version": 3,
    "name": "MultiClip",
    "version": 1.0,
    "description": "A floating clipboard for copying, cutting, and pasting text with ease.",
    "permissions": [
        "storage",
        "clipboardRead",
        "clipboardWrite"
    ],
    "host_permissions": ["<all_urls>"],
    "background": {
        "service_worker": "background.js"
    },
    "content_scripts": [
        {
            "matches": ["<all_urls>"],
            "js": ["content.js"]
        }
    ],
    "action": {
        "default_popup": "popup.html",
        "default_icon": "icons/icon48.png"
    }, 
    "icons": {
        "16": "icons/icon16.png",
        "48": "icons/icon48.png",
        "128": "icons/icon128.png"
    }
}
```
- It tells the browser:

    - What our extension is (name, version, description)

    - Which files it uses (scripts, HTML, icons)

    - What features it needs (permissions like clipboard access or storage)

    - Where it runs (which websites or pages)

    - What version of the extension format we're using (like Manifest v3)

- I used `createElement()` method to create HTML elements using JavaScript inside `content.js`:
- I wrote `addElement()` function which creates HTML elements and inserts them in the DOM. So, It's dynamically adding HTML content to the page through JavaScript. 
```js
function addElement () {
    const newDiv = document.createElement("div");
    newDiv.classList.add("floating-clipboard");
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", addElement);
} else {
    addElement();
}
```

- I added a header, a button, and an items container. The header would allow dragging, the button lets the user close the clipboard, and the items container is where we'd show the saved text chunks.

```js
const newHeader = document.createElement("header");
newHeader.classList.add("clipboard-header");

const newButton = document.createElement("button");
newButton.innerText = "X";
newButton.classList.add("close-btn");
newHeader.appendChild(newButton);

const newItems = document.createElement("ul");
newItems.classList.add("clipboard-items");

newDiv.append(newHeader, newItems);
```

- The extension by now automatically pops up every time the user visits a webpage. To fix this:
- I added this code in `background.js` to listen for icon clicks:
- `background.js`:
```js
chrome.action.onClicked.addListener((tab) => {
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ["content.js"]
  });

  chrome.scripting.insertCSS({
    target: { tabId: tab.id },
    files: ["styles.css"]
  });
});
```

- I also added `scripting` and `activeTab` in `permissions` inside `manifest.json`:
```json
...
"permissions": [
    "storage",
    "clipboardRead",
    "clipboardWrite",
    "scripting",
    "activeTab"
],
...
```

- Next thing, I wanted to make this extension as flexible as possible, ensuring smooth user experience. 
- So, I decided on multiple routes to add text to clipboard box:
- **Right-click -> "Add to MultiClip"** (Context Menu)
- **Keyboard Shortcut**

- I added `"contextMenus"` to the permissions list in `manifest.json` and then created the right-click menu option in `background.js` that'll show only when text is selected:
```js
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "addToClipboard",
        title: "Add to MultiClip",
        contexts: ["selection"]
    });
});
```
- I then created the functionality that sends the selected text to the script:
- `background.js`:
```js
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "addToClipboard" && info.selectionText) {
        chrome.tabs.sendMessage(tab.id, {
            type: "ADD_TO_CLIPBOARD",
            text: info.selectionText
        });
    }
});
```

- I added a listener for the message sent (text copied) in `content.js`:
```js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "ADD_TO_CLIPBOARD") {
        const clipboardList = document.querySelector(".clipboard-items");
        
        if (clipboardList) {
            const newItem = document.createElement("li");
            newItem.classList.add("clipboard-item");
            newItem.innerText = message.text;

            const buttons = document.createElement("div");
            buttons.classList.add("buttons");

            const copyBtn = document.createElement("button");
            copyBtn.classList.add("btn");
            copyBtn.innerText = "Copy";
            
            const cutBtn = document.createElement("button");
            cutBtn.classList.add("btn");
            cutBtn.innerText = "Cut";
            
            const removeBtn = document.createElement("button");
            removeBtn.classList.add("btn");
            removeBtn.innerText = "Remove";
            
            buttons.append(copyBtn, cutBtn, removeBtn)
           
            copyBtn.addEventListener("click", () => {
                navigator.clipboard.writeText(message.text);
            });
            
            cutBtn.addEventListener("click", () => {
                navigator.clipboard.writeText(message.text);
                newItem.remove();
            });
            
            removeBtn.addEventListener("click", () => {
                newItem.remove();
            });
            
            
            newItem.append(buttons);
            
            clipboardList.appendChild(newItem);
        }
    }
});
```

- I saved the data so it wouldn't disappear on page reload:
```js
chrome.storage.local.get(["clipboardData"], (result) => {
    const savedItems = result.clipboardData || [];

    savedItems.forEach(text => {
        const newItem = document.createElement("li");
        newItem.classList.add("clipboard-item");
        newItem.innerText = text;

        const buttons = document.createElement("div");
        buttons.classList.add("buttons");

        const copyBtn = document.createElement("button");
        copyBtn.classList.add("btn");
        copyBtn.innerText = "Copy";

        const cutBtn = document.createElement("button");
        cutBtn.classList.add("btn");
        cutBtn.innerText = "Cut";

        const removeBtn = document.createElement("button");
        removeBtn.classList.add("btn");
        removeBtn.innerText = "Remove";

        buttons.append(copyBtn, cutBtn, removeBtn);

        copyBtn.addEventListener("click", () => {
            navigator.clipboard.writeText(text);
        });

        cutBtn.addEventListener("click", () => {
            navigator.clipboard.writeText(text);
            newItem.remove();
            updateStorage();
        });

        removeBtn.addEventListener("click", () => {
            newItem.remove();
            updateStorage();
        });

        newItem.append(buttons);
        newItems.appendChild(newItem);
    });
});

function updateStorage() {
    const updatedItems = [];
    document.querySelectorAll(".clipboard-item").forEach(item => {
        updatedItems.push(item.firstChild.textContent);
    });
    chrome.storage.local.set({ clipboardData: updatedItems });
}
```

- I restructured the code because it wasn't working as I expected. I also added other functionalities such as a message that appears each time the user clicks a button.
- `content.js`:
```js
function updateStorageFromDOM() {
    const updatedItems = Array.from(document.querySelectorAll(".clipboard-item"))
        .map(item => item.dataset.text);
    chrome.storage.local.set({ clipboardData: updatedItems });
}
```
- This functions grabs all current `.clipboard-item` elements from the DOM.
- Extracts the data-text from each item.
- Saves this array into Chrome's local storage under the key clipboardData.

```js
function showMessage(button, text) {
    const msg = document.createElement("span");
    msg.innerText = text;
    msg.classList.add("tiny-msg");
    msg.style.marginLeft = "8px";
    msg.style.fontSize = "0.75rem";
    msg.style.color = "green";

    button.parentNode.appendChild(msg);
    setTimeout(() => msg.remove(), 1500);
}
```
- This function shows a tiny green message like "Copied!" or "Removed!" next to the button when the user clicks an action.

```js
function createClipboardItem(text) {
    const li = document.createElement("li");
    li.classList.add("clipboard-item");
    li.dataset.text = text;
    li.setAttribute("draggable", "true");
    const contentSpan = document.createElement("span");
    contentSpan.innerText = text;
    li.appendChild(contentSpan);

    const buttonsDiv = document.createElement("div");
    buttonsDiv.classList.add("buttons");

    const copyBtn = document.createElement("button");
    copyBtn.innerText = "Copy";
    copyBtn.classList.add("btn");

    const cutBtn = document.createElement("button");
    cutBtn.innerText = "Cut";
    cutBtn.classList.add("btn");

    const removeBtn = document.createElement("button");
    removeBtn.innerText = "Remove";
    removeBtn.classList.add("btn");

    buttonsDiv.append(copyBtn, cutBtn, removeBtn);
    li.appendChild(buttonsDiv);

    copyBtn.addEventListener("click", () => {
        navigator.clipboard.writeText(text);
        showMessage(copyBtn, "Copied!");
    });

    cutBtn.addEventListener("click", () => {
        navigator.clipboard.writeText(text);
        li.remove();
        updateStorageFromDOM();
        showMessage(cutBtn, "Cut!");
    });

    removeBtn.addEventListener("click", () => {
        li.remove();
        updateStorageFromDOM();
        showMessage(removeBtn, "Removed!");
    });

    return li;
}
```

- This functions:
- Creates an `<li>` with the class clipboard-item and sets `draggable="true"`.
- Adds inner content: a `<span>` for the text and 3 buttons: Copy, Cut, Remove.
- Defines what each button does:
    - Copy: writes text to the clipboard
    - Cut: writes to clipboard + removes item + updates storage
    - Remove: just deletes item + updates storage
- Returns the completed `<li>`.

```js
function renderClipboardUI() {
    const wrapper = document.createElement("div");
    wrapper.classList.add("floating-clipboard");

    const header = document.createElement("header");
    header.classList.add("clipboard-header");

    const closeBtn = document.createElement("button");
    closeBtn.innerText = "X";
    closeBtn.classList.add("close-btn");
    closeBtn.addEventListener("click", () => wrapper.remove());

    header.appendChild(closeBtn);
    wrapper.appendChild(header);

    const ul = document.createElement("ul");
    ul.classList.add("clipboard-items");

    chrome.storage.local.get(["clipboardData"], ({ clipboardData }) => {
        (clipboardData || []).forEach(text => {
            const li = createClipboardItem(text);
            ul.appendChild(li);
        });
    });

    wrapper.appendChild(ul);
    document.body.appendChild(wrapper);
}
```
- This sets up the entire UI overlay for the clipboard. It:
    - Creates a floating `<div>` to hold the clipboard (`.floating-clipboard`)
    - Adds a header with a close (X) button
    - Adds a `<ul>` with class `.clipboard-items`
    - Loads saved clipboard data from Chrome storage
    - Adds the items to the UI

```js
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", renderClipboardUI);
} else {
    renderClipboardUI();
}
```
- This block of code makes sure the UI is only rendered after the page has loaded.

```js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "ADD_TO_CLIPBOARD") {
        const text = message.text.trim();
        const list = document.querySelector(".clipboard-items");
        if (!text || !list) return;

        chrome.storage.local.get(["clipboardData"], ({ clipboardData }) => {
            const existing = clipboardData || [];

            if (!existing.includes(text)) {
                const li = createClipboardItem(text);
                list.appendChild(li);

                const updated = [...existing, text];
                chrome.storage.local.set({ clipboardData: updated });
            }
        });
    }
});
```
- This sets up a listener so the content script can receive messages from the popup, background script, or other parts of the extension.
- It's only handling one specific type of message here: `ADD_TO_CLIPBOARD`.

```js
chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === "local" && changes.clipboardData) {
        const newClipboard = changes.clipboardData.newValue || [];

        const list = document.querySelector(".clipboard-items");
        if (!list) return;

        list.innerHTML = "";

        newClipboard.forEach(text => {
            const li = createClipboardItem(text);
            list.appendChild(li);
        });
    }
});
```
- And this one allows for real-time sync across tabs. It:
    - Checks if clipboardData has changed
    - Rebuilds the list based on the new storage data

- I made the extension draggable:
```js
    let isDragging = false;
    let offsetX, offsetY;

    wrapper.addEventListener("mousedown", (e) => {
        if (e.button !== 0) return;
        if (e.target.closest("button")) return;

        isDragging = true;
        const rect = wrapper.getBoundingClientRect();
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;

        document.body.style.userSelect = "none";
    });

    window.addEventListener("mousemove", (e) => {
        if (!isDragging) return;
        e.preventDefault();
        wrapper.style.left = `${e.clientX - offsetX}px`;
        wrapper.style.top = `${e.clientY - offsetY}px`;
    });

    window.addEventListener("mouseup", () => {
        isDragging = false;
        document.body.style.userSelect = "";
    });
```
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
    - If it wants to use storate -> we declare "`storage`" 
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

## What I Learned
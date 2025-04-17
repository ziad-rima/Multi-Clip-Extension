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

- **Popup UI (popup.html)**: Optional little window that appears when the user click the extension icon in the toolbar.

- **Storage APIs**: Used to save clipboard items (localStorage or chrome.storage.local).

- **Messaging System**: Lets content and background scripts talk to each other. 

## Building Process

## What I Learned
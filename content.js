// Utility: Save current clipboard items to storage
function updateStorageFromDOM() {
    const updatedItems = Array.from(document.querySelectorAll(".clipboard-item"))
        .map(item => item.dataset.text);
    chrome.storage.local.set({ clipboardData: updatedItems });
}

function showMessage(button, text, root = document) {
    const msg = document.createElement("span");
    msg.innerText = text;
    msg.classList.add("tiny-msg");
    button.parentNode.appendChild(msg);
    setTimeout(() => msg.remove(), 1500);
}

function createClipboardItem(text, shadowRoot) {
    const li = document.createElement("li");
    li.classList.add("clipboard-item");
    li.dataset.text = text;
    li.setAttribute("draggable", "true");

    li.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("text/plain", text);
        li.classList.add("dragging");
    });

    li.addEventListener("dragend", () => {
        li.classList.remove("dragging");
    });

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
        showMessage(copyBtn, "Copied!", shadowRoot);
    });

    cutBtn.addEventListener("click", () => {
        navigator.clipboard.writeText(text);
        li.remove();
        updateStorageFromDOM();
        showMessage(cutBtn, "Cut!", shadowRoot);
    });

    removeBtn.addEventListener("click", () => {
        li.remove();
        updateStorageFromDOM();
        showMessage(removeBtn, "Removed!", shadowRoot);
    });

    return li;
}

let clipboardShadowRoot = null;
let clipboardList = null;


function renderClipboardUI() {
    const container = document.createElement("div");
    const shadow = container.attachShadow({ mode: "open" });

    const wrapper = document.createElement("div");
    wrapper.classList.add("floating-clipboard");

    const header = document.createElement("header");
    header.classList.add("clipboard-header");

    const title = document.createElement("span");

    const clearBtn = document.createElement("button");
    clearBtn.innerText = "Clear All";
    clearBtn.classList.add("clear-btn");

    const closeBtn = document.createElement("button");
    closeBtn.innerText = "X";
    closeBtn.classList.add("close-btn");

    header.append(title, clearBtn, closeBtn);
    wrapper.appendChild(header);

    const ul = document.createElement("ul");
    ul.classList.add("clipboard-items");

    clipboardShadowRoot = shadow;
    clipboardList = ul;

    wrapper.appendChild(ul);
    shadow.appendChild(wrapper);
    document.body.appendChild(container);

    chrome.storage.local.get(["clipboardData"], ({ clipboardData }) => {
        (clipboardData || []).forEach(text => {
            const li = createClipboardItem(text, shadow);
            ul.appendChild(li);
        });
    });

    closeBtn.addEventListener("click", () => container.remove());

    clearBtn.addEventListener("click", () => {
        ul.innerHTML = "";
        chrome.storage.local.set({ clipboardData: [] });
    });

    const style = document.createElement("style");
    style.textContent = `
        * {
            all: unset;
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        .floating-clipboard {
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
            align-items: flex-start;
            position: fixed;
            top: 20px;
            left: auto;
            right: 20px;
            width: 300px;
            height: 300px;
            background-color: rgb(55, 46, 46);
            border: 1px solid rgb(91, 77, 77);
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
            border-radius: 8px;
            font-family: "Georgia", sans-serif;
            z-index: 9999;
            color: white;
            left: unset;
            cursor: move;
        }

        .clipboard-header {
            display: flex;
            justify-content: space-between;
            width: 100%;
            border-bottom: 1px solid #524040;
            background-color: rgb(69, 58, 58);
            border-top-right-radius: 8px;
            border-top-left-radius: 8px;
            font-size: 16px;
        }

        .clipboard-items {
            list-style: none;
            max-height: 240px;
            overflow-y: auto;
            width: 100%;
        }

        .clipboard-item {
            width: 100%;
            margin-top: 2px;
            font-size: 16px;
        }

        .clipboard-item span {
            line-height: 1.4;
            white-space: normal;
            word-break: break-word;
        }

        .buttons {
            display: flex;
            justify-content: space-evenly;
            align-items: center;
            margin-top: 1.2px;
            width: 100%;
        }

        .btn {
            flex-grow: 1;
            border: none;
            outline: none;
            background-color: rgb(69, 58, 58);
            cursor: pointer;
            text-align: center;
            color: rgb(180, 149, 240);
        }

        .btn:hover {
            color: rgb(171, 138, 236);
        }

        .close-btn {
            border-radius: 30px;
            border: none;
            outline: none;
            width: 22px;
            height: 22px;
            text-align: center;
            background-color: rgb(134, 71, 71);
            margin: 5px 7px;
            cursor: pointer;
        }

        .clear-btn {
            background: none;
            border: none;
            outline: none;
            text-decoration: underline;
            margin-left: 2px;
            cursor: pointer;
        }

        .tiny-msg {
            font-size: 0.75rem;
            margin-left: 8px;
            color: green;
        }

        .dragging {
            opacity: 0.5;
        }
    `;
    shadow.appendChild(style);

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
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", renderClipboardUI);
} else {
    renderClipboardUI();
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "ADD_TO_CLIPBOARD") {
        const text = message.text.replace(/\s+/g, ' ').trim();
        const list = clipboardList;
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

chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === "local" && changes.clipboardData) {
        const newClipboard = changes.clipboardData.newValue || [];

        const list = clipboardList;
        if (!list) return;

        list.innerHTML = "";

        newClipboard.forEach(text => {
            const li = createClipboardItem(text);
            list.appendChild(li);
        });
    }
});

/* jshint esversion: 6 */

const siteInput = document.getElementById("siteInput");

const addBtn = document.getElementById("addBtn");

const addTabBtn = document.getElementById("addTabBtn");

const clearBtn = document.getElementById("clearBtn");

const siteList = document.getElementById("siteList");

function normalizeSite(input) {
  try {
    const url = new URL(input.includes("://") ? input : "https://" + input);

    return url.hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return input
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .split("/")[0];
  }
}

function getSites() {
  return new Promise((resolve) => {
    chrome.storage.local.get(["blockedSites"], (result) => {
      resolve(result.blockedSites || []);
    });
  });
}

function saveSites(sites) {
  return new Promise((resolve) => {
    chrome.storage.local.set(
      {
        blockedSites: sites,
      },

      resolve,
    );
  });
}

async function render() {
  const sites = await getSites();

  siteList.innerHTML = "";

  if (!sites.length) {
    const li = document.createElement("li");

    li.className = "empty";

    li.textContent = "No blocked websites";

    siteList.appendChild(li);

    return;
  }

  for (let i = 0; i < sites.length; i++) {
    const li = document.createElement("li");

    const text = document.createElement("span");

    const remove = document.createElement("button");

    text.textContent = sites[i];

    remove.textContent = "Remove";

    remove.className = "remove";

    remove.onclick = async () => {
      sites.splice(i, 1);

      await saveSites(sites);

      render();
    };

    li.append(text, remove);

    siteList.appendChild(li);
  }
}

async function addSite(value) {
  const site = normalizeSite(value);

  if (!site) {
    return;
  }

  const sites = await getSites();

  if (sites.includes(site)) {
    return;
  }

  sites.push(site);

  await saveSites(sites);

  siteInput.value = "";

  render();
}

addBtn.onclick = () => {
  addSite(siteInput.value);
};

siteInput.addEventListener(
  "keydown",

  (e) => {
    if (e.key === "Enter") {
      addSite(siteInput.value);
    }
  },
);

addTabBtn.onclick = async () => {
  const tabs = await chrome.tabs.query({
    active: true,

    currentWindow: true,
  });

  if (tabs.length) {
    addSite(tabs[0].url);
  }
};

clearBtn.onclick = async () => {
  await saveSites([]);

  render();
};

render();

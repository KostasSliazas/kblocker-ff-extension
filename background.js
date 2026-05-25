/* jshint esversion: 6 */

function storageGet(keys) {
  return new Promise((resolve) => {
    chrome.storage.local.get(keys, resolve);
  });
}

function storageSet(data) {
  return new Promise((resolve) => {
    chrome.storage.local.set(data, resolve);
  });
}

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

async function getSites() {
  const result = await storageGet(["blockedSites"]);

  return result.blockedSites || [];
}

function createRule(site, id) {
  return {
    id,

    priority: 1,

    action: {
      type: "redirect",

      redirect: {
        url: chrome.runtime.getURL("blocked.html"),
      },
    },

    condition: {
      urlFilter: "||" + normalizeSite(site) + "^",

      resourceTypes: ["main_frame"],
    },
  };
}

async function updateRules() {
  try {
    const sites = await getSites();

    const oldRules = await chrome.declarativeNetRequest.getDynamicRules();

    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: oldRules.map((r) => r.id),

      addRules: sites.map((site, index) => {
        return createRule(site, index + 1);
      }),
    });
  } catch (err) {
    console.error(err);
  }
}

async function init() {
  const result = await storageGet(["blockedSites"]);

  if (!Array.isArray(result.blockedSites)) {
    await storageSet({
      blockedSites: [],
    });
  }

  await updateRules();
}

chrome.runtime.onInstalled.addListener(init);

chrome.runtime.onStartup.addListener(init);

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.blockedSites) {
    updateRules();
  }
});

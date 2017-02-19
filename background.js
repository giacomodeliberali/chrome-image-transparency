/* global chrome */

(function () {
  // extension = chrome.runtime.getManifest(),
  // log = console.log.bind(
  //   console,
  //   '%c' + extension.name + ' ' + extension.version,
  //   'background: #333; color: #bada55; padding: 0 3px; border-radius: 4px;'
  // ),
  const defaults = {
    color1: '#ffffff',
    color2: '#cccccc',
    size: 10
  };
  const template = ({ color1, color2, size, sizeFull } = {}) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${ sizeFull }" height="${ sizeFull }">
    <rect width="${ sizeFull }" height="${ sizeFull }" fill="${ color1 }"/>
    <rect y="${ size }" width="${ size }" height="${ size }" fill="${ color2 }"/>
    <rect x="${ size }" width="${ size }" height="${ size }" fill="${ color2 }"/>
</svg>`;

  function renderTemplate() {
    const size = window.localStorage.size;
    const color1 = window.localStorage.color1;
    const color2 = window.localStorage.color2;
    const sizeFull = size * 2;
    return template({ color1, color2, size, sizeFull });
  }

  function checkDefaults() {
    if (!window.localStorage.color1)
      window.localStorage.color1 = defaults.color1;
    if (!window.localStorage.color2)
      window.localStorage.color2 = defaults.color2;
    if (!window.localStorage.size)
      window.localStorage.size = defaults.size;
  }

  function getTemplate() {
    checkDefaults();
    return renderTemplate();
  }

  function handleMessages(request, sender, sendResponse) {
    if (request.action === 'giveBackground') {
      sendResponse({
        template: getTemplate()
      });
    } else if (request.action === 'giveDefaults') {
      sendResponse({ defaults });
    }
  }

  function renderCss() {
    const svg = window.btoa(getTemplate());
    // gradient for Content Security Policy error (eg. GitHub)
    // gradient is buggy
    return `img { background: url(data:image/svg+xml;base64,${ svg }) !important; }`;
  }

  function eventHeadersReceived(details) {
    let go;

    // todo fix dla fb
    details.responseHeaders.forEach(e => {
      if (/content-type/i.test(e.name) && /^image\/.+/i.test(e.value)) {
        go = true;
      }
    });

    if (go)
      setTimeout(function (tabId) {
        chrome.pageAction.show(tabId);
        chrome.tabs.insertCSS(details.tabId, {
          code: renderCss(),
          runAt: 'document_start'
        });
      }.bind(chrome, details.tabId), 20);
  }

  checkDefaults();

  chrome.pageAction.onClicked.addListener(() => {
    chrome.tabs.create({
      'url': 'chrome://extensions/?options=' + chrome.runtime.id
    });
  });

  chrome.webRequest.onHeadersReceived.addListener(
    eventHeadersReceived,
    {
      urls: ['<all_urls>'],
      types: ['main_frame']
    },
    ['responseHeaders']);

  chrome.runtime.onMessage.addListener(handleMessages);
}());

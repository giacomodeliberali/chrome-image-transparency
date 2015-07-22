/* global chrome */

(function(glob) {

  var
    extension = chrome.runtime.getManifest(),
    log = console.log.bind(
      console,
      '%c' + extension.name + ' ' + extension.version,
      'background: #333; color: #bada55; padding: 0 3px; border-radius: 4px;'
    ),
    defaults = {
      color1: '#ffffff',
      color2: '#cccccc',
      size: 8
    },
    template = '<svg xmlns="http://www.w3.org/2000/svg" width="{sizeFull}" ' +
      'height="{sizeFull}">' +
      '<rect width="{sizeFull}" height="{sizeFull}" fill="{color1}"/>' +
      '<rect y="{size}" width="{size}" height="{size}" fill="{color2}"/>' +
      '<rect x="{size}" width="{size}" height="{size}" fill="{color2}"/></svg>';

  function render(str, sub) {
    for (var key in sub) {
      str = str.replace(new RegExp('{' + key + '}', 'g'), sub[key]);
    }
    return str;
  }

  function renderTemplate() {
    var size = glob.localStorage.size;
    return render(template, {
      color1: glob.localStorage.color1,
      color2: glob.localStorage.color2,
      size: size,
      sizeFull: size * 2
    });
  }

  function checkDefaults() {
    if (!glob.localStorage.color1) {
      glob.localStorage.color1 = defaults.color1;
    }
    if (!glob.localStorage.color2) {
      glob.localStorage.color2 = defaults.color2;
    }
    if (!glob.localStorage.size) {
      glob.localStorage.size = defaults.size;
    }
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
      sendResponse({
        defaults: defaults
      });
    }
  }

  function renderCss() {
    var bg = glob.btoa(getTemplate());
    return 'html,svg{background:url(data:image/svg+xml;base64,' + bg + ');}';
  }

  function eventHeadersReceived(details) {

    var go;

    details.responseHeaders.forEach(function(e) {
      if (/content-type/i.test(e.name) && /^image\/.+/i.test(e.value)) {
        go = true;
      }
    });

    if (go) {
      setTimeout(function(tabId) {
        chrome.pageAction.show(tabId);
        chrome.tabs.insertCSS(details.tabId, {
          code: renderCss(),
          runAt: 'document_start'
        });
      }.bind(chrome, details.tabId), 20);
    }

  }

  checkDefaults();

  chrome.pageAction.onClicked.addListener(function() {
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

}(this));

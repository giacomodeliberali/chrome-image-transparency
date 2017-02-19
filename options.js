/* global chrome */

(function () {

  // const extension = chrome.runtime.getManifest();
  // const log = console.log.bind(
  //     console,
  //     '%c' + extension.name + ' ' + extension.version,
  //     'background: #333; color: #bada55; padding: 0 3px; border-radius: 4px;'
  //   );
  const doc = window.document;
  const html = doc.documentElement;
  const id = doc.getElementById.bind(doc);
  const color1 = id('color1');
  const color2 = id('color2');
  const size = id('size');
  const reset = id('reset');
  const sizeOutput = id('size-output');
  const defaults = {};

  function debounce(fn, delay) {
    let timer = null;
    return function () {
      clearTimeout(timer);
      timer = setTimeout(Function.prototype.apply.bind(fn, this, arguments), delay);
    };
  }

  function setBackground(response) {
    if (response && response.template)
      html.style.backgroundImage = 'url(data:image/svg+xml;base64,' + window.btoa(response.template) + ')';
  }

  function getTemplateAndSetIt() {
    // background generation in one place
    chrome.runtime.sendMessage({
      action: 'giveBackground'
    }, setBackground);
  }

  function getValue(name) {
    if (!window.localStorage[name])
      window.localStorage[name] = defaults[name];
    return window.localStorage[name];
  }

  function saveValue(name, value, halt) {
    window.localStorage[name] = value;
    if (!halt) getTemplateAndSetIt();
  }

  function syncSize() {
    sizeOutput.value = this.value;
  }

  function restoreValues() {
    color1.value = getValue('color1');
    color2.value = getValue('color2');
    size.value = getValue('size');
    getTemplateAndSetIt();
    syncSize.call(size);
  }

  function resetValues() {
    saveValue('color1', defaults.color1, true);
    saveValue('color2', defaults.color2, true);
    saveValue('size', defaults.size);
    restoreValues();
  }

  function setEvents() {
    color1.addEventListener('input', debounce(function () {
      saveValue('color1', this.value);
    }, 500));
    color2.addEventListener('input', debounce(function () {
      saveValue('color2', this.value);
    }, 500));
    size.addEventListener('input', syncSize);
    size.addEventListener('input', debounce(function () {
      saveValue('size', this.value);
    }, 500));
    reset.addEventListener('click', resetValues);
  }

  function setDefaultsAndStart(response) {
    if (response && response.defaults) {
      Object.assign(defaults, response.defaults);
      setEvents();
      restoreValues();
    }
  }

  // init
  chrome.runtime.sendMessage({
    action: 'giveDefaults'
  }, setDefaultsAndStart);

}());

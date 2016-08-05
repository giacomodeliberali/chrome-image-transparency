/* global chrome */

(function(glob) {

  const extension = chrome.runtime.getManifest();
  const id = doc.getElementById.bind(doc);
  const log = console.log.bind(
      console,
      '%c' + extension.name + ' ' + extension.version,
      'background: #333; color: #bada55; padding: 0 3px; border-radius: 4px;'
    );
  const doc = glob.document;
  const html = doc.documentElement;
  const color1 = id('color1');
  const color2 = id('color2');
  const size = id('size');
  const reset = id('reset');
  const sizeOutput = id('size-output');
  const defaults = {};
  
  function debounce(fn, delay) {
    var timer = null;
    return function () {
      clearTimeout(timer);
      timer = setTimeout(Function.prototype.apply.bind(fn, this, arguments), delay);
    };
  }

  function setBackground(response) {
    if (response && response.template && response.template.svg)
      html.style.backgroundImage = 'url(data:image/svg+xml;base64,' + glob.btoa(response.template.svg) + ')';
  }

  function getTemplateAndSetIt() {
    // background generation in one place
    chrome.runtime.sendMessage({
      action: 'giveBackground'
    }, setBackground);
  }

  function getValue(name) {
    if (!glob.localStorage[name])
      glob.localStorage[name] = defaults[name];
    return glob.localStorage[name];
  }

  function saveValue(name, value, halt) {
    glob.localStorage[name] = value;
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
    color1.addEventListener('input', debounce(function() {
      saveValue('color1', this.value);
    }, 500));
    color2.addEventListener('input', debounce(function() {
      saveValue('color2', this.value);
    }, 500));
    size.addEventListener('input', syncSize);
    size.addEventListener('input', debounce(function() {
      saveValue('size', this.value);
    }, 500));
    reset.addEventListener('click', resetValues);
  }

  function setDefaultsAndStart(response) {
    if (response && response.defaults) {
      defaults = response.defaults;
      setEvents();
      restoreValues();
    }
  }

  // init
  chrome.runtime.sendMessage({
      action: 'giveDefaults'
    }, setDefaultsAndStart);

}(this));

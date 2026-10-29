(function (root) {
  'use strict';

  const $ = selector => document.querySelector(selector);

  function node(tag, text, className) {
    const element = document.createElement(tag);
    if (text !== undefined) element.textContent = text;
    if (className) element.className = className;
    return element;
  }

  function field(labelText, element) {
    const label = node('label', labelText);
    label.append(element);
    return label;
  }

  function input(type, value, fieldName, id) {
    const element = node('input');
    element.type = type;
    element.value = value;
    element.dataset.field = fieldName;
    element.dataset.id = id;
    return element;
  }

  function textArea(value, fieldName, id, className) {
    const element = node('textarea', undefined, className);
    element.value = value;
    element.dataset.field = fieldName;
    element.dataset.id = id;
    return element;
  }

  root.FakeFlowsUI = { $, node, field, input, textArea };
})(globalThis);

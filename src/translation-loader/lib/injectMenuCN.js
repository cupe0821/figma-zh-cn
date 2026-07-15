"use strict";

const mainDictionary = require("../js/lang.cn.json");
const menuDictionary = require("../js/lang.cn.menu.json");

const dictionary = Object.fromEntries(
  Object.entries(Object.assign({}, mainDictionary, menuDictionary)).map(
    ([key, value]) => [key.toLocaleLowerCase("en-US"), value],
  ),
);

function translateLabel(value) {
  if (typeof value !== "string") return value;
  return dictionary[value.toLocaleLowerCase("en-US")] || value;
}

function translateMenuItems(items) {
  if (!Array.isArray(items)) return;
  for (const item of items) {
    if (typeof item.label === "string") item.label = translateLabel(item.label);
    if (item.submenu) translateMenuItems(item.submenu);
  }
}

function injectMenu(menu) {
  try {
    translateMenuItems(menu);
  } catch (error) {
    console.error("[FigmaCN] Failed to translate native menu", error);
  }
  return menu;
}

function injectMenuLangObject(strings) {
  try {
    for (const key of Object.keys(strings || {})) {
      const value = strings[key];
      if (value && typeof value.string === "string") {
        value.string = translateLabel(value.string);
      }
    }
  } catch (error) {
    console.error("[FigmaCN] Failed to translate desktop strings", error);
  }
  return strings;
}

module.exports = { injectMenu, injectMenuLangObject };

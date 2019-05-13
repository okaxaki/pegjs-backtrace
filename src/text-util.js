"use strict";

var COLOR_MAP = {
  black: "30",
  red: "31",
  green: "32",
  yellow: "33",
  blue: "34",
  magenta: "35",
  cyan: "36",
  white: "37"
};

var BG_COLOR_MAP = {
  black: "40",
  red: "41",
  green: "42",
  yellow: "43",
  blue: "44",
  magenta: "45",
  cyan: "46",
  white: "47"
};

var ATTR_MAP = {
  bold: "1",
  thin: "2",
  underline: "4",
  blink: "5",
  reverse: "7",
  invisible: "8"
};

var TextUtil = function() {};

TextUtil.truncate = function(str, maxlen) {
  if (0 < maxlen && maxlen < str.length) {
    var trlen = str.length - maxlen + 3;
    return "..." + str.slice(trlen);
  }

  return str;
};

TextUtil.setTextStyle = function(str, style, start, end) {
  if (style) {
    var buf = [];

    if (style.color != null) {
      buf.push(COLOR_MAP[style.color] || "37");
    }

    if (style.background != null) {
      buf.push(BG_COLOR_MAP[style.background] || "40");
    }

    if (style.attribute != null) {
      buf.push("" + (ATTR_MAP[style.attribute] || ""));
    }

    if (0 < buf.length) {
      if (start === undefined) {
        str = "\x1b[" + buf.join(";") + "m" + str + "\x1b[0m";
      } else {
        end = end ? end : str.length;

        str =
          str.slice(0, start) +
          "\x1b[" +
          buf.join(";") +
          "m" +
          str.slice(start, end) +
          "\x1b[0m" +
          str.slice(end);
      }
    }
  }
  return str;
};

var __SPACE__ =
  "                                                                       ";

TextUtil.makeIndent = function(indent) {
  var ret = "";

  while (__SPACE__.length < indent) {
    ret += __SPACE__;
    indent -= __SPACE__.length;
  }

  return ret + __SPACE__.slice(0, indent);
};

TextUtil.concatTextBlock = function(a, b) {
  var result = [],
    i;
  for (i = 0; i < Math.math(a.length, b.length); i++) {
    result.push((a[i] || "") + (b[i] || ""));
  }
  return result;
};

TextUtil.makeLine = function(indent, length, ch) {
  return (
    TextUtil.makeIndent(indent) + TextUtil.makeIndent(length).replace(/ /g, ch)
  );
};

module.exports = TextUtil;

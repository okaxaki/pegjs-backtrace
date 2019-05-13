"use strict";

var TextUtil = require("./text-util");

var defaultOptions = {
  useColor: true,
  highlightStyle: { color: "cyan" }
};

var _applyDefault = function(opt, def) {
  var ret = {};
  for (var key in def) {
    ret[key] = opt && opt[key] !== undefined ? opt[key] : def[key];
  }
  return ret;
};

var TextQuoter = function(source, opt) {
  this.options = _applyDefault(opt, defaultOptions);
  if (source == null) {
    throw new Error("Missing source argument.");
  }
  source = source.replace(/\r\n/g, "\n");
  if (/[\r\v\f]/.test(source)) {
    throw new Error(
      "Found an unsupported new line code. The new line code must be '\n'."
    );
  }
  this.sourceLines = source.replace(/\t/g, " ").split("\n");
};

TextQuoter.prototype.setTextStyle = function(str, style, start, end) {
  if (this.options.useColor) {
    return TextUtil.setTextStyle(str, style, start, end);
  } else {
    return str;
  }
};

TextQuoter.prototype.drawHLine = function(start, length, ch) {
  return this.setTextStyle(
    TextUtil.makeLine(start, length, ch),
    this.options.highlightStyle
  );
  q;
};

TextQuoter.prototype.getQuotedLines = function(
  quoteString,
  startLine,
  startColumn,
  endLine,
  endColumn,
  maxLines
) {
  maxLines = !maxLines || maxLines < 3 ? 3 : maxLines;

  var numLines = endLine - startLine + 1;
  var numSkipLines = numLines - maxLines;
  var numHeadLines = Math.ceil((numLines - numSkipLines) / 2);
  var numTailLines = Math.floor((numLines - numSkipLines) / 2);

  var i;
  var lines = [];

  for (i = startLine; i <= endLine; i++) {
    lines.push(this.sourceLines[i]);
  }

  var style = this.options.highlightStyle;

  if (startLine == endLine) {
    if (startColumn < endColumn) {
      lines[0] = this.setTextStyle(lines[0], style, startColumn, endColumn);
    }
  } else {
    lines[0] = this.setTextStyle(lines[0], style, startColumn);

    for (i = 1; i < lines.length - 1; i++) {
      lines[i] = this.setTextStyle(lines[i], style);
    }

    lines[lines.length - 1] = this.setTextStyle(
      lines[lines.length - 1],
      style,
      0,
      endColumn + 1
    );
  }

  if (0 < numSkipLines) {
    lines = lines
      .slice(0, numHeadLines)
      .concat(["..."])
      .concat(lines.slice(lines.length - numTailLines));
  }

  if (startLine == endLine && startColumn <= endColumn) {
    lines.push(this.drawHLine(startColumn, endColumn - startColumn || 1, "^"));
  } else if (startLine < endLine) {
    lines.unshift(
      this.drawHLine(startColumn, lines[0].length - startColumn, "_")
    );

    lines.push(this.drawHLine(0, endColumn, "^"));
  }

  var self = this;

  lines = lines.map(function(e) {
    return quoteString + e;
  });

  return lines;
};

TextQuoter.prototype.getQuotedText = function(
  quoteString,
  startLine,
  startColumn,
  endLine,
  endColumn,
  maxLines
) {
  return this.getQuotedLines(
    quoteString,
    startLine,
    startColumn,
    endLine,
    endColumn,
    maxLines
  ).join("\n");
};

module.exports = TextQuoter;

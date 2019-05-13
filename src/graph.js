"use strict";

var TextUtil = require("./text-util");

var defaultOptions = {
  useColor: true
};

var _applyDefault = function(opt, def) {
  var ret = {};

  for (var key in def) {
    ret[key] = opt && opt[key] !== undefined ? opt[key] : def[key];
  }

  return ret;
};

var TextGraph = function(opt) {
  this.options = _applyDefault(opt, defaultOptions);
};

TextGraph.prototype.setTextStyle = function(str, style, start, end) {
  if (this.options.useColor) {
    return TextUtil.setTextStyle(str, style, start, end);
  } else {
    return str;
  }
};

TextGraph.prototype.drawState = function(nodes, column, contents, isLastState) {
  var buf = [];

  contents = contents || [];

  if (0 < contents.length) {
    buf.push(this.drawStateLine(nodes, column, isLastState) + contents.shift());

    while (0 < contents.length) {
      buf.push(
        this.drawStateLine(nodes, undefined, isLastState) + contents.shift()
      );
    }
  } else {
    buf.push(this.drawStateLine(nodes, column, isLastState));
  }
  return buf;
};

TextGraph.prototype.drawStateLine = function(nodes, column, isLastState) {
  var line = "",
    i,
    quote = isLastState ? "  " : "| ";

  for (i = 0; i < nodes.length; i++) {
    if (column === i) {
      if (nodes[i].type == "rule.fail") {
        line += this.setTextStyle("x ", { color: "red" });
      } else if (nodes[i].type == "rule.match") {
        line += this.setTextStyle("o ", { color: "green" });
      } else {
        line += this.setTextStyle("? ", { color: "yellow" });
      }
    } else {
      line += this.setTextStyle(quote, nodes[i].style);
    }
  }

  return line;
};

TextGraph.prototype.drawMergeEdge = function(fromIndex, toIndex, nodes) {
  var lines = ["", ""],
    i;

  for (i = 0; i < nodes.length; i++) {
    if (i <= toIndex) {
      lines[0] += this.setTextStyle("| ", nodes[i].style);
    } else if (i < fromIndex - 1) {
      lines[0] +=
        this.setTextStyle("|", nodes[i].style) +
        this.setTextStyle("_", nodes[fromIndex].style);
    } else if (i == fromIndex - 1) {
      lines[0] +=
        this.setTextStyle("|", nodes[i].style) +
        this.setTextStyle("/", nodes[fromIndex].style);
    } else if (fromIndex < i || (i == fromIndex && toIndex + 1 == fromIndex)) {
      lines[0] += this.setTextStyle("| ", nodes[i].style);
    } else {
      lines[0] += "  ";
    }
  }

  for (i = 0; i < nodes.length; i++) {
    if (i < toIndex) {
      lines[1] += this.setTextStyle("| ", nodes[i].style);
    } else if (i == toIndex) {
      lines[1] +=
        this.setTextStyle("|", nodes[i].style) +
        this.setTextStyle("/", nodes[fromIndex].style);
    } else if (i < fromIndex) {
      lines[1] += this.setTextStyle("| ", nodes[i].style);
    } else if (i < nodes.length - 1) {
      lines[1] += this.setTextStyle(" /", nodes[i + 1].style);
    } else {
      lines[1] += "  ";
    }
  }

  return lines;
};

TextGraph.prototype.drawMergeEdges = function(fromIndexes, toIndex, nodes) {
  nodes = nodes.slice(0);
  fromIndexes = fromIndexes.slice(0);

  fromIndexes.sort(function(a, b) {
    return a - b;
  });

  var lines = [],
    i;

  while (0 < fromIndexes.length) {
    var fromIndex = fromIndexes.shift();

    lines = lines.concat(this.drawMergeEdge(fromIndex, toIndex, nodes));
    nodes.splice(fromIndex, 1);

    for (var i = 0; i < fromIndexes.length; i++) {
      if (fromIndex < fromIndexes[i]) fromIndexes[i]--;
    }
  }
  return lines;
};

module.exports = TextGraph;

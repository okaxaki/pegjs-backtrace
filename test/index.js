"use strict";

var parser = require("./test");
var Tracer = require("../src/main.js");

var source = process.argv[2] || "2 + 10 / (3 / 4)";

var tracer = new Tracer(source, {
  useColor: true,
  showTrace: true,
  showSource: true,
  showFullPath: true,
  hiddenPaths: ["primary/.*"],
  // on: ["rule.enter", "rule.match", "rule.fail", "error"]
});

try {
  let result = parser.parse(source, { tracer: tracer });
  console.log(tracer.getParseTreeString());
  console.log(tracer.getBacktraceString())
  console.log(result)
} catch (e) {
  console.log(e.message);
  console.log(tracer.getBacktraceString());
}

"use strict";

var parser = require("./test");
var Tracer = require("../src/main.js");

var source = "2+(3/4)";

var tracer = new Tracer(source, {
  useColor: true,
  showTrace: true,
  showSource: true,
  showFullPath: true,
  hiddenPaths: ["primary/.*"]
});

try {
  parser.parse(source, { tracer: tracer });
  console.log(tracer.getParseTreeString() + "\n");
} catch (e) {
  console.log("\n" + e.message + "\n");
  console.log(tracer.getBacktraceString() + "\n");
}

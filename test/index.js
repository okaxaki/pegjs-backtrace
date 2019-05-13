"use strict";

let parser = require("./test");
let Tracer = require("../src/main.js");

let success = process.argv[2] || "1 / 1";
let failure = process.argv[3] || "oh no";

// on: ["rule.enter", "rule.match", "rule.fail", "error"]
let tracerOptions = [
  {
    // showTrace: true,
    hiddenPaths: ["*/primary/*", "*/ws/*"],
    showFullPath: true,
    showSource: true
  }
]

let json = (input) => JSON.stringify(input, null, 2)

tracerOptions.forEach((options) => {
  let tracerSuccess = new Tracer(success, options);
  let tracerFailure = new Tracer(failure, options);

  let result = parser.parse(success, { tracer: tracerSuccess });

  console.log(`\n   SUCCESS FOR ${success}\n\noptions:${json(options)}`)
  console.log("\n== getParseTreeString() ==\n")
  console.log(tracerSuccess.getParseTreeString());
  console.log("\n== getBacktraceString() ==\n")
  console.log(tracerSuccess.getBacktraceString())
  console.log("\n== result ==\n")
  console.log(result)

  try {
    parser.parse(failure, { tracer: tracerFailure });
  } catch (e) {
    console.log(`\n   FAILURE FOR ${failure}\n\noptions: ${json(options)}`)
    console.log("\n== error message ==\n")
    console.log(e.message);
    console.log("\n== getBacktraceString() ==\n")
    console.log(tracerFailure.getBacktraceString());
  }
})

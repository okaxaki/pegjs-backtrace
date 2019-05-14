"use strict";

let parser = require("./test");
let Tracer = require("../src/main.js");

let success = process.argv[2] || "1 / 1";
let failure = process.argv[3] || "oh no";

let tracerOptions = [
  // {
  //   showTrace: true,
  //   hiddenPaths: ["*/primary/*", "*/ws/*"],
  //   showFullPath: true,
  //   showSource: true
  // },
  {
    hiddenPaths: ["*/ws/*"],
    showFullPath: true,
    showSource: true,
    matchesNode: function(node, options = {}) {
      if (options.backtrace) {
        return true;
      }

      if (options.grep && !node.rule.includes(options.grep)) {
        return false;
      }

      if (options.nodeType && options.nodeType != node.type) {
        return false;
      }

      return true;
    }
  }
]

let matchesOptions = [
  {},
  { grep: 'integer' },
  { nodeType: 'rule.match', grep: 'integer' },
]

let json = (input) => JSON.stringify(input)

tracerOptions.forEach((tracerOptions) => {
  matchesOptions.forEach((matchesOptions) => {
    let tracerSuccess = new Tracer(success, tracerOptions);
    let tracerFailure = new Tracer(failure, tracerOptions);

    let result = parser.parse(success, { tracer: tracerSuccess });

    console.log(`\n   SUCCESS FOR ${success} \n`);
    console.log(`\n  tracer options: ${json(tracerOptions)}\n`)
    console.log(`\n== getParseTreeString(${json(matchesOptions)}) ==\n`)
    console.log(tracerSuccess.getParseTreeString(matchesOptions));
    console.log("\n== result ==\n")
    console.log(result)

    try {
      parser.parse(failure, { tracer: tracerFailure });
    } catch (e) {
      console.log(`\n   FAILURE FOR ${failure} \n`);
      console.log(`\n  tracer options: ${json(tracerOptions)}\n`)
      console.log(`\n== getBacktraceString(${json(matchesOptions)}) ==\n`)
      console.log(tracerFailure.getBacktraceString(matchesOptions));
      console.log("\n== error message ==\n")
      console.log(e.message);
    }
  })
})

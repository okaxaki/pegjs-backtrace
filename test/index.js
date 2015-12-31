"use strict"

var parser = require('./test.js');
var Tracer = require('../src/main.js');


var source = "2+(3*4)";
var tracer = new Tracer(source,{useColor:true});

try {
	parser.parse(source,{tracer:tracer});
	console.log(tracer.dumpBacktraceTree());
} catch(e) {
	console.log(e.message);
	console.log(tracer.dumpBacktraceTree());
}


"use strict";

var TextQuoter = require('./text-quoter.js');

var defaultOptions = {
	hiddenPaths:[],
	parentTracer:null,
	useColor:true,
	truncateThreshold:128,
	verbose:true,
	maxSourceLines:6,
	parent:null,
};

function truncate(str, maxlen) {
	if(0<maxlen && maxlen < str.length) {
		var trlen = str.length - maxlen + 3;
		return "..." + str.slice(trlen);
	}
	return str;
}

var __space__ = "                                                                       ";
function makeIndent(indent) {
	var ret = '';
	while(__space__.length<indent) {
		ret += __space__;
		indent -= __space__.length;
	}
	return ret + __space__.slice(0,indent);
}

var makeDisplayPath = function(node,showPathName,truncateThreshold) {
	if(showPathName) {
		return truncate(node.path,truncateThreshold) + node.rule;
	} else {
		return makeIndent(node.path.replace(/[^\/]/g,'').length).replace(/ /g,'-') + " " + node.rule;
	}
};

var Tracer = function(source, opt) {

	this.options = {};
	for(var key in defaultOptions) {
		this.options[key] = (opt&&opt[key]!==undefined)?opt[key]:defaultOptions[key];
	}

	this.parent = this.options.parent;
	this.quoter = new TextQuoter(source,{useColor:this.options.useColor});
	this.hiddenPatterns = [];
	for(var i=0;i<this.options.hiddenPaths.length;i++) {
		var pattern = this.options.hiddenPaths[i];
		if(pattern instanceof RegExp) {
			this.hiddenPatterns[i] = pattern;
		} else {
			this.hiddenPatterns[i] = new RegExp("(^|/)" + pattern + "(/|$)");			
		}
	}

	this.init();

};

Tracer.prototype.init = function() {
	this.root = { 
		type:'root', 
		path:'', 
		parent:null,
		matches:[], 
		fails:[], 
		rule:'',
		location:{
			start:{
				offset:0,
				line:0,
				column:0
			},
			end:{
				offset:0,
				line:0,
				column:0
			}
		}
	};
	this.currentNode = this.root;
	this.maxFailPos = 0;
	this.maxFails = [];
};

Tracer.prototype.setTextStyle = function(str,style) {
	return this.quoter.setTextStyle(str,style);
};

var _convertToZeroBasedLocation = function(location) {
	return {
		start:{
			offset:location.start.offset,
			line:location.start.line-1,
			column:location.start.column-1
		},
		end:{
			offset:location.end.offset,
			line:location.end.line-1,
			column:location.end.column-1
		},
	};
};

Tracer.prototype.getSourceQuote = function(location,maxLines) {
	var location = _convertToZeroBasedLocation(location);
	return this.quoter.getQuotedText(
		location.start.line,location.start.column,
		location.end.line,location.end.column,
		maxLines);
};

Tracer.prototype.isPathHidden = function(path) {
	for(var i=0;i<this.hiddenPatterns.length;i++) {
		var pattern = this.hiddenPatterns[i];
		if(pattern.test(path)) {
			return true;
		}
	}
	return false;
};

Tracer.prototype.trace = function(evt) {

	if(this.parent&&this.parent.trace) {
		this.parent.trace(evt);
	}

	switch(evt.type){
		case "rule.enter":
		this.onEnter(evt);
		break;
		case "rule.match":
		this.onMatch(evt);
		break;
		default:
		this.onFail(evt);
		break;
	}
};

Tracer.prototype.onEnter = function(evt) {		
	var node = {
		path:this.currentNode.path + this.currentNode.rule + '/',
		parent:this.currentNode, 
		matches:[],
		fails:[],
		type:evt.type, 
		rule:evt.rule,
		location:evt.location,
		lastChildType: null,
	};
	this.currentNode = node;
};

Tracer.prototype.onFail = function(evt) {

	if( this.maxFailPos < evt.location.start.offset ) {
		this.maxFailPos = evt.location.start.offset;
		this.maxFails = [this.currentNode];
	} 

	if( this.maxFailPos == evt.location.start.offset ) {
		this.maxFails.push[this.currentNode];
	}

	this.currentNode.type = evt.type;
	this.currentNode.location = evt.location;
	this.currentNode.parent.fails.push(this.currentNode);
	this.currentNode.parent.lastChildType = "fail";
	this.currentNode = this.currentNode.parent;

};

Tracer.prototype.onMatch = function(evt) {
	this.currentNode.type = evt.type;
	this.currentNode.location = evt.location;
	this.currentNode.parent.matches.push(this.currentNode);
	this.currentNode.parent.lastChildType = "match";
	this.currentNode = this.currentNode.parent;
};

Tracer.prototype.dumpNode = function(node,source) {

	if(this.isPathHidden(node.path + node.rule)) {
		return "";
	}

	var buf = [];
	switch(node.type) {
		case "rule.match": 
		buf.push(this.setTextStyle("[MATCH]",{color:'green'}));
		break;
		case "rule.fail": 
		buf.push(this.setTextStyle("[FAIL] ",{color:'red'}));
		break;
		default:
		buf.push("[Internal Error]");
		break;
	}

	buf.push(" " + node.location.start.line + ":" + node.location.start.column + 
		"-" + node.location.end.line + ":" + node.location.end.column + " ");

	buf.push(makeDisplayPath(node,this.options.verbose,this.options.truncateThreshold) + "\n");

	if(source) {
		buf.push(this.getSourceQuote(node.location,this.options.maxSourceLines)+'\n');
	}

	return buf.join('')+'\n';
};

Tracer.prototype.dumpFailureStack = function() {
	var ret = '';
	for(var i=0;i<this.maxFails.length;i++) {
		ret += 'Failure ' + (i+1) + ' of ' + this.maxFails.length + "\n";
		var node = this.maxFails[i];
		while(node!=null&&node!=this.root) {
			ret += this.dumpNode(node, this.options.verbose);
			node = node.parent;
		}
		return ret;
	}
};

module.exports = Tracer;

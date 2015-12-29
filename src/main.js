"use strict";

var TextQuoter = require('./text-quoter.js');

var defaultOptions = {
	hiddenPaths:[],
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

	this.headStringMap = {
		"rule.enter":this.setTextStyle("- ",{color:'cyan'}),
		"rule.match":this.setTextStyle("o ",{color:'green'}),
		"rule.fail":this.setTextStyle("x ",{color:'red'}),
		"error":this.setTextStyle("! ",{color:'red'})
	};

	this.typeStringMap = {
		"rule.enter":this.setTextStyle("ENTER",{color:'cyan'}),
		"rule.match":this.setTextStyle("MATCH",{color:'green'}),
		"rule.fail":this.setTextStyle("FAIL ",{color:'red'}),
		"error":this.setTextStyle("ERROR",{color:'red'})
	};

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

Tracer.prototype.getSourceLines = function(quoteString,location,maxLines) {
	var location = _convertToZeroBasedLocation(location);
	return this.quoter.getQuotedLines(quoteString,
		location.start.line,location.start.column,
		location.end.line,location.end.column,
		maxLines);
};

Tracer.prototype.getSourceText = function(quoteString,location,maxLines) {
	var location = _convertToZeroBasedLocation(location);
	return this.quoter.getQuotedText(quoteString,
		location.start.line,location.start.column,
		location.end.line,location.end.column,
		maxLines);
};

Tracer.prototype.isHidden = function(node) {
	var path = node.path + node.rule;
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

var _isParentRule = function(parent,child) {
	return parent.path + parent.rule + "/" == child.path;
};

var _isSameRule = function(n1,n2) {
	return (n1.path == n2.path) && (n1.rule == n2.rule);
};

Tracer.prototype.onFail = function(evt) {

	if( this.maxFailPos < evt.location.start.offset ) {
		this.maxFailPos = evt.location.start.offset;
		this.maxFails = [this.currentNode];
	} else if( this.maxFailPos == evt.location.start.offset ) {
		var found = false;
		for(var i=this.maxFails.length-1;0<=i;i--) {
			var f=this.maxFails[i];
			if(_isParentRule(this.currentNode,f) || _isSameRule(this.currentNode,f)) {
				found = true;
				break;
			}
		}
		if(!found) {
			this.maxFails.push(this.currentNode);
		}
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

Tracer.prototype.buildNodeText = function(node,source) {
	var buf = [];
	buf.push( 
		this.setTextStyle(node.location.start.line + ":" + node.location.start.column + "-" + node.location.end.line + ":" + node.location.end.column,{attribute:'thin'}) 
		+ " " + 
		this.setTextStyle(node.rule,{color:"yellow",attribute:'bold'})
	);

	if(source) {
		var lines = this.getSourceLines("",node.location,this.options.maxSourceLines);
		for(var i=0;i<lines.length;i++) {
			buf.push(lines[i]);
		}
	}
	return buf;
};

Tracer.prototype.dumpNode = function(node,source) {

	if(this.isHidden(node)) {
		return "";
	}

	var buf = [];
	var prefix = (node.parent!==this.root)?this.setTextStyle("|",{color:'yellow'}):" ";
	buf.push(this.headStringMap[node.type]||this.headStringMap.error);
	buf.push(this.setTextStyle(node.rule,{color:"yellow"}) + "\n");
	buf.push(prefix + " " + node.location.start.line + ":" + node.location.start.column + "-");
	buf.push(node.location.end.line + ":" + node.location.end.column);
	buf.push("\n");
	if(source) {
		buf.push(this.getSourceText(prefix+" ",node.location,this.options.maxSourceLines)+'\n');
	}

	return buf.join('');
};

Tracer.prototype.getVisibleFails = function() {	
	var nodes = [];
	for(var i=0;i<this.maxFails.length;i++) {
		var node = this.maxFails[i];
		while(node.parent!=this.root&&this.isHidden(node)) {
			node = node.parent;
		}
		if(nodes.indexOf(node)<0) {
			nodes.push(node);
		}
	}
	return nodes;
};

Tracer.prototype.getFailTree = function(node) {

	var children = [], i, c;
	node = node || this.root;

	var ret = {
		parent:null,
		type:node.type,
		path:node.path,
		rule:node.rule,
		children:children,
		location:node.location,
	};

	for(i=0;i<node.matches.length;i++) {
		c = this.getFailTree(node.matches[i]);
		if(c) {
			c.parent = ret;
			children.push(c);
		}
	}

	for(i=0;i<node.fails.length;i++) {
		c = this.getFailTree(node.fails[i]);
		if(c) {
			c.parent = ret;
			children.push(c);
		}
	}

	if(children.length == 0 && this.maxFails.indexOf(node)<0) {
		return null;
	}

	var self = this;
	ret.children = ret.children.filter(function(e){
		return !self.isHidden(e);	
	});

	return ret;

};

var treeToLinear = function(tree) {
	var buf = [];
	var i,j;
	for(i=0;i<tree.children.length;i++) {
		var subs = treeToLinear(tree.children[i]);
		for(j=0;j<subs.length;j++) {
			buf.push(subs[j]);
		}
	}	
	buf.push(tree);
	return buf;
};

Tracer.prototype.dumpBacktrace = function() {
	var ret = '';
	for(var i=0;i<this.maxFails.length;i++) {
		ret += 'Failure ' + (i+1) + ' of ' + this.maxFails.length + "\n";
		var node = this.maxFails[i];
		while(node!=null&&node!=this.root) {
			ret += this.dumpNode(node, this.options.verbose);
			node = node.parent;
		}
		ret += "\n";
	}
	return ret;
};

Tracer.prototype.dumpBacktraceTree = function() {

	var lines = [];
	var tree = this.getFailTree();
	var list = treeToLinear(tree).reverse();
	list.shift();// remove the root

	var nodes = [];
	var gd = require('./graph.js');

	var styles = [
		{color:'yellow'},
		{color:'cyan'},
		{color:'magenta'},
		{color:'blue'},
		{color:'white'},
		{color:'red'},
		{color:'green'},
	];

	while(0<list.length) {

		var node = list.pop();

		var parentIndexes = [];

		for(var i=0;i<nodes.length;i++) {
			if(nodes[i].parent == node) {
				parentIndexes.push(i);
			}
		}

		var column;

		if(parentIndexes.length==0) {
			column = nodes.length;
			node.style = styles[column%styles.length];
			nodes.push(node);
			lines = lines.concat( gd.drawState(nodes,column,this.buildNodeText(node,this.options.verbose)) );
		} else {
			column = parentIndexes.shift();
			lines = lines.concat(gd.drawMerge(parentIndexes,column,nodes));
			node.style = nodes[column].style;
			nodes[column] = node;
			nodes = nodes.filter(function(e,i) {return (parentIndexes.indexOf(i)<0);});
			lines = lines.concat( gd.drawState(nodes, column, this.buildNodeText(node,this.options.verbose)) );			
		}

		if(!this.options.verbose&&0<list.length) {
			lines = lines.concat( gd.drawState(nodes) );
		}
	}

	return lines.join('\n');
};

module.exports = Tracer;

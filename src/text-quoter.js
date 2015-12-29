"use strict";

var defaultOptions = {
	useColor:true,
	highlightStyle:{color:'cyan'},
};

var COLOR_MAP = { black:0, red:1, green:2, yellow:3, blue:4, magenta:5, cyan:6, white:7 };
var ATTR_MAP = { bold:1, thin:2, underline:4, blink:5, reverse:7, invisible:8 };

var _applyDefault = function(opt,def) {
	var ret = {};
	for(var key in def) {
		ret[key] = (opt&&opt[key]!==undefined)?opt[key]:def[key];
	}
	return ret;
};

var _setTextStyle = function(str,style,start,end) {
	if(!style) return str;

	var buf = [];
	if(style.color!=null) { buf.push('3'+(COLOR_MAP[style.color]||7)); }
	if(style.background!=null) { buf.push('4'+(COLOR_MAP[style.background]||7)); }
	if(style.attribute!=null) {	buf.push(''+(ATTR_MAP[style.attribute]||'')); }
	if(0<buf.length) {
		if(start===undefined) {
			return "\x1b[" + buf.join(';') + "m" + str + "\x1b[0m";
		}
		end = end?end:str.length;
		return str.slice(0,start) + "\x1b[" + buf.join(';') + "m" + str.slice(start,end) + "\x1b[0m" + str.slice(end);
	} else {
		return str;
	}
};


var __space__ = "                                                                       ";

var _makeIndent = function(indent) {
	var ret = '';
	while(__space__.length<indent) {
		ret += __space__;
		indent -= __space__.length;
	}
	return ret + __space__.slice(0,indent);
};

var TextQuoter = function(source,opt) {
	this.options = _applyDefault(opt,defaultOptions);
	if(/[\r\v\f]/.test(source)) {
		throw new Error("Found an unsupported new line code. The new line code must be '\\n'.");
	}
	this.sourceLines = source.split('\n');
};

TextQuoter.prototype.setTextStyle = function(str,style,start,end) {
	if(this.options.useColor) {
		return _setTextStyle(str,style,start,end);
	} else {
		return str;
	}
}

TextQuoter.prototype.makeOverline = function(indent,length,ch) {
	return _makeIndent(indent) + this.setTextStyle(
		_makeIndent(length).replace(/ /g,ch),this.options.highlightStyle);
};

TextQuoter.prototype.getQuotedLines = function(quoteString,startLine,startColumn,endLine,endColumn,maxLines) {

	maxLines = (!maxLines||maxLines<3)?3:maxLines;

	var numLines = (endLine - startLine) + 1;
	var numSkipLines = numLines - maxLines;
	var numHeadLines = Math.ceil((numLines - numSkipLines)/2); 
	var numTailLines = Math.floor((numLines - numSkipLines)/2);

	var i;
	var lines = [];
	for(i=startLine;i<=endLine;i++) {
		lines.push(this.sourceLines[i]);
	}

	var style = this.options.highlightStyle;
	if(startLine == endLine) {
		if(startColumn<endColumn) {
			lines[0] = this.setTextStyle(lines[0],style,startColumn,endColumn);
		}
	} else {
		lines[0] = this.setTextStyle(lines[0],style,startColumn);
		for(i=1;i<lines.length-1;i++) {
			lines[i] = this.setTextStyle(lines[i],style);
		}
		lines[lines.length-1] = this.setTextStyle(lines[lines.length-1],style,0,endColumn+1);
	}

	if(0 < numSkipLines) {
		lines = lines.slice(0,numHeadLines).concat(['...']).concat(lines.slice(lines.length-numTailLines));
	}

	if(startLine==endLine&&startColumn<=endColumn) {
		lines.push(this.makeOverline(startColumn, (endColumn-startColumn)||1, '^'));
	} else if(startLine<endLine) {
		lines.unshift(this.makeOverline(startColumn,(lines[0].length-startColumn),'>'));
		lines.push(this.makeOverline(0,endColumn,'<'));
	}
	var self = this;
	lines = lines.map(function(e){return quoteString + e;});
	return lines;
};

TextQuoter.prototype.getQuotedText = function(quoteString,startLine,startColumn,endLine,endColumn,maxLines) {
	return this.getQuotedLines(quoteString,startLine,startColumn,endLine,endColumn,maxLines).join('\n');
};


module.exports = TextQuoter;
var setTextStyle = function(str,style,start,end) {
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

var COLOR_MAP = { black:0, red:1, green:2, yellow:3, blue:4, magenta:5, cyan:6, white:7 };
var ATTR_MAP = { bold:1, thin:2, underline:4, blink:5, reverse:7, invisible:8 };

var GraphDraw = function(){};

var _drawState = function(nodes,column,contents) {
	var buf = [];
	contents = contents || [];
	if(0<contents.length) {
		buf.push(_drawStateLine(nodes,column) + contents.shift());
		while(0<contents.length) {
			buf.push(_drawStateLine(nodes) + contents.shift());
		}
	} else {
		buf.push(_drawStateLine(nodes,column));
	}
	return buf;
};

var _drawStateLine = function(nodes,column) {
	var line = '', i;
	for(i=0;i<nodes.length;i++) {
		if(column===i) {
			if(nodes[i].type=="rule.fail") {
				line += setTextStyle("x ",{color:'red'});
			} else if(nodes[i].type=="rule.match") {
				line += setTextStyle("o ",{color:'green'});
			} else {
				line += setTextStyle("? ",{color:'yellow'});
			}
		} else {
			line += setTextStyle("| ",nodes[i].style);
		}
	}
	return line;
};

var _drawMergeEdge = function(fromIndex,toIndex,nodes) {

	var lines = ['',''], i;	
	for(i=0;i<nodes.length;i++) {
		if(i<=toIndex) {
			lines[0] += setTextStyle("| ",nodes[i].style);
		} else if(i<fromIndex-1) {
			lines[0] += setTextStyle("|", nodes[i].style) + setTextStyle('_',nodes[fromIndex].style);
		} else if(i==fromIndex-1) {
			lines[0] += setTextStyle("|", nodes[i].style) + setTextStyle('/',nodes[fromIndex].style);
		} else if(fromIndex<i || (i==fromIndex && toIndex+1==fromIndex)) {
			lines[0] += setTextStyle('| ',nodes[i].style);
		} else {
			lines[0] += '  ';
		}
	}

	for(i=0;i<nodes.length;i++) {
		if(i<toIndex) {
			lines[1] += setTextStyle("| ",nodes[i].style);
		} else if(i==toIndex) {
			lines[1] += setTextStyle("|",nodes[i].style) + setTextStyle('/',nodes[fromIndex].style);
		} else if(i<fromIndex) {
			lines[1] += setTextStyle("| ",nodes[i].style);
		} else if(i<nodes.length-1) {
			lines[1] += setTextStyle(" /",nodes[i+1].style);
		} else {
			lines[1] += '  ';
		}
	}
	return lines;
};

var _drawMergeEdges = function(fromIndexes,toIndex,nodes) {
	nodes = nodes.slice(0);
	fromIndexes = fromIndexes.slice(0);
	fromIndexes.sort(function(a,b){return a-b;});
	var lines=[],i;
	while(0<fromIndexes.length) {
		var fromIndex = fromIndexes.shift();
		lines = lines.concat(_drawMergeEdge(fromIndex,toIndex,nodes));
		nodes.splice(fromIndex,1);
		for(var i=0;i<fromIndexes.length;i++) {
			if(fromIndex<fromIndexes[i]) fromIndexes[i]--;
		}
	}
	return lines;
};

GraphDraw.drawMerge = _drawMergeEdges;
GraphDraw.drawState = _drawState;

module.exports = GraphDraw;

"use strict"

var COLOR_MAP = { black:0, red:1, green:2, yellow:3, blue:4, magenta:5, cyan:6, white:7 };
var ATTR_MAP = { bold:1, thin:2, underline:4, blink:5, reverse:7, invisible:8 };

var TextStyle = function() {};

TextStyle.setTextStyle = function(str,style,start,end) {
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

module.exports = TextStyle;


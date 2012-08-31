/**
 * jsonPlus is JSOL that works with json+ data structure. 
 *
 * json+ structure is same as json data except it allowed functions as object type.
 * This give as java script object literal without variable declaration to be more precise.
 * 
 * ------------------------------------------------------ 
 * json+ data structure:	
 *  {
 *  "param":"one",
 *  "foo":function(a) { alert(a); },
 *  "array": [1,2,3,4],
 *  "boolean":true,
 *  ...
 *  }
 * ------------------------------------------------------
 *
 * Used code parts from:
 * json_sans_eval.js - Mike Samuel <mikesamuel@gmail.com> - http://code.google.com/p/json-sans-eval/
 *
 * @param json+{string|file}
 * @return {Object}|{Error}
 * @author Josip Kalebic <josip.kalebic@gmail.com>
 */
 
var jsonPlus = {
  title: 'jsonPlus',
  version: 'v1.0',
  options: {
	mode: 'parse'	// "parse", "eval"
  },
  isfuncDesc: new RegExp('^(( *)function( *)\((.*)\)( *))|(( *)regex( *))$'),
  isfuncAnonymous: new RegExp('^(( *)function( *)anonymous\((.*)\)( *))'),
  number: '(?:-?\\b(?:0|[1-9][0-9]*)(?:\\.[0-9]+)?(?:[eE][+-]?[0-9]+)?\\b)',
  oneChar: '(?:[^\\0-\\x08\\x0a-\\x1f\"\\\\]|\\\\(?:[\"/\\\\bfnrt]|u[0-9A-Fa-f]{4}))',
  funcdef: '(?:_[0-9])',
  escapeSequence: new RegExp('\\\\(?:([^u])|u(.{4}))', 'g'),
  escapes : {'"': '"','/': '/','\\': '\\','b': '\b','f': '\f','n': '\n','r': '\r','t': '\t'},
  EMPTY_STRING: new String(''),
  SLASH : '\\',
  firstTokenCtors : { '{': Object, '[': Array },
  hop: Object.hasOwnProperty,
  unescapeOne : function (_, ch, hex) { return ch ? escapes[ch] : String.fromCharCode(parseInt(hex, 16)); },
  reverse: function(str) { return str.split( '' ).reverse().join( '' ); },
  trim : function(str) { 
			str = str.replace(/^\s+/, ''); 
			for (var i = str.length - 1; i >= 0; i--) {
				if (/\S/.test(str.charAt(i))) {
					str = str.substring(0, i + 1);
					break;
				}
			}
		return str;
  },
  getType : function(e) {
    // should detect more than simply object, can detect RegExp too
    // put into lowercase to ensure compatibility with existing code
    return Object.prototype.toString.call(e).split(/\W/)[2].toLowerCase();
  },

	get : function(source, opt) {
		if(opt) { this.extendOptions(opt); }	
		var objdata = this.ajax.get(source);
		return this.parse(objdata);
	},

	parse : function(data, opt) {
		if(opt) { this.extendOptions(opt); }	
		var validate = this.validate(data);
		if(validate.valid == true) {
			switch(this.options.mode) {
				case "eval":
					return this.evalObject(data);
				break;
					
				case "parse":
				default:
					return this.parsePlus(data);
				break;
			}			
		} else {
			return {error: validate.error};
		}
	},
	
	stringify : function(object, opt) {
		if(opt) { this.extendOptions(opt); }	
		return this.stringifyObj(object);
   },

   extend : function(firstobj, secondobj) {
		return this.deepExtend(firstobj, secondobj);
   },   
   
  
   extendOptions : function(opt) {
	this.options = this.deepExtend(this.options, opt);
   }, 
  
   validate: function (jsonstring) {
	  var counter = 0;
	  var error = "";
	  var zerocounter = 0;
	  var currline;
	  var currchar;
	  var counteractivated = false;
	  //var strlines = this.trim(jsonstring).split("\n\r");
	  var strlines = this.trim(jsonstring).split("\n");
	  
	  var strlineslength = strlines.length;

	    if(strlines[0].charAt(0) != "{") {
			return {valid: false, error: "Error at Line: 1: Object must start with curly bracket"};
 	    } else {
	  
		  for(var i=0; i<strlineslength; i++) {
			var linelength = strlines[i].length;
			if(linelength > 0) {
				for(var j=0; j<linelength; j++) {
				  if(strlines[i].charAt(j) == "{") { counter++; counteractivated = true; currline = i; currchar = j + 1; }
				  if(strlines[i].charAt(j) == "}") { counter--; counteractivated = true; currline = i; currchar = j + 1; }
				  if(counter == 0 && counteractivated == true) { zerocounter++; }
				  counteractivated = false;
				  
				  if(counter < 0) {
					error = "Error at Line: " + (i+1) + ", char: " + (j+1);
				  }
				  if(counter > 0 && j>=linelength-1) {
					error = "Error at Line: " + (i+1) + ", char: " + (j+1);
				  }          
				  if(zerocounter > 1) {
					error = "Error: only one object is allowed, counted: " +  zerocounter;
				  }
				  //document.write(strlines[i].charAt(j));
				}
			}
		  }
		  
		  if(counter == 0 && zerocounter == 1) {
			return {valid: true, error: error};
		  } else {
			return {valid: false, error: error};
		  }
		  
		}  
	},
	isFuncDeclared : function(str) {
		
		var strlength = str.length;
		var tmpStr = "";
		if(strlength > 0) {
			for(i=str.length; i>=0; i--) {
				if(str.charAt(i) == ":") { 	
					break;
				} else {
					tmpStr+= str.charAt(i);
				}
			}
		}
		var strFound = this.reverse(tmpStr);
		var isCleanFunc = strFound.match(this.isfuncDesc);
		if(isCleanFunc != null) {
			return isCleanFunc[0];
		} else {
			return false;
		}
	 
	 },
	 
	 parseFunc: function(jsonstring) {
	  var counter = 0;
	  var tmpobjs = new Array();
	  var objs = new Array();
	  var objisFunc = new Array();
	  var funcContainer = {};
	  
	  var strlineslength = jsonstring.length;

	  for(var i=0; i<strlineslength; i++) {

			  if(jsonstring.charAt(i) == "{") { 
				counter++;  
				objisFunc[counter] = this.isFuncDeclared(jsonstring.substring(0,i));
			  }
			  
			  if(counter > 0) {
				for(var j=1; j<=counter; j++) {
					if(!tmpobjs[j]) { tmpobjs[j] = ""; }
					if(objisFunc[j] != false) { tmpobjs[j]+=jsonstring.charAt(i); }
				}
			  }

			  if(jsonstring.charAt(i) == "}") { 
				if(objisFunc[counter] != false) { objs[objs.length] = objisFunc[counter] + tmpobjs[counter]; }
				tmpobjs[counter] = "";
				objisFunc[counter] = false;
				counter--;  
			  }
	
	  }
	  
	  for (item in objs) {
		 var funckey = "_" + item;
		 funcContainer[funckey] = objs[item];
		 jsonstring = jsonstring.replace(objs[item], funckey);
	  }

	  return new Array(jsonstring, funcContainer);
	}, 
	
	evalObject : function(data) {
		var script = "var tmpObj=" + data;
		script = script.replace("\n", "");
		try  {
			this.globalEvalx(script);
			//eval("tmpObj=" + data);
		} catch(err)  {
			var tmpObj = err;
		}
		return tmpObj;
	},
	
	globalEvalx : function(src) {
		if (window.execScript) {
			window.execScript(src);
			return;
		}
		var fn = function() {
			window.eval.call(window,src);
		};
		fn();
	},
	
	stringifyObj : function(sourceobj, arrayset) {
		var output = [], temp;
		for (var i in sourceobj) {
			if (sourceobj.hasOwnProperty(i)) {
				if(arrayset === true)  {
					temp = "";
				} else {
					temp = "\"" + i + "\":";
				}
				switch (this.getType(sourceobj[i])) {
					case "object":
						if (sourceobj[i] instanceof Array) {
							temp += this.stringify(sourceobj[i], true);
						} else {
							temp += this.stringify(sourceobj[i], false);
						}
						break;
          case "regexp":
            var parts = sourceobj[i].toString().match(/^\/(.+)\/(\w*)$/);
            temp += 'regex{"'+parts[1]+'","'+parts[2]+'"}';
            break;
          case "function":
            temp += this.cleanFunction(sourceobj[i].toString());
            break;
					case "string":
						temp += "\"" + sourceobj[i] + "\"";  
						break;
					case "number":
						temp += sourceobj[i];
						break;	
					case "boolean":
						temp += sourceobj[i];
						break;
					default :
					   temp += sourceobj[i];
				}
				output.push(temp);
			}
		}
		if(arrayset === true)  {
			return "[" + output.join() + "]";
		} else {
			return "{" + output.join() + "}";
		}
	},

	deepExtend : function(obj1, obj2) {

		for (var key in obj2) {

    		if(!obj1[key]) {
				obj1[key] = {};
    		}
		
			switch (this.getType(sourceobj[i])) {
			case "object":
					if (obj2[key] instanceof Array) {
						obj1[key] = obj2[key];
					} else {
						obj1[key] = this.deepExtend(obj1[key], obj2[key]);
					}
				break;
			default :
					obj1[key] = obj2[key];	
                break;  
			};
	
    	};
		
    return  obj1;	

	},
  createFunction : function (str) {
    var params = str.match(/\((.*?)\)/);
    var functionbody = str.match(/{[^{]+({[^{}]+?}[^{]+)*[^}]+}/);
    var body = functionbody[0].substr(1, functionbody[0].length-2);
    return new Function(params[0].substr(1, params[0].length-2), body);
  },
  createRegex : function (str) {
    var parts = str.match(/^regex{\"(.+?)\",\"(\w*)\"}$/)
    
    return new RegExp(parts[1],parts[2]);
  },
	
	cleanFunction : function(fstr) {
	
		var isAnonymous = fstr.match(this.isfuncAnonymous);
		if(isAnonymous) {
			return fstr.replace(/( *)anonymous\(/, "(");
		} else {
			return fstr;
		}
	
	},
	
    parsePlus : function(jsonstr) {
 
    var parsedobjdata = this.parseFunc(jsonstr);
	var json = parsedobjdata[0];
	var funcContainer = parsedobjdata[1];
	var jsonToken = new RegExp('(?:false|true|null|[\\{\\}\\[\\]]'
      + '|' + this.funcdef	  
      + '|' + this.number
      + '|(?:\"' + this.oneChar + '*\"))', 'g');

    var toks = json.match(jsonToken);
    // Construct the object to return
    var result = {};
    var tok = toks[0];
    var topLevelPrimitive = false;
    var key;
    var stack = [result];
	var n = toks.length;
	
    //for (var i = 1 - topLevelPrimitive, n = toks.length; i < n; ++i) {
	for (var i = 1 - topLevelPrimitive; i < n; ++i) {
      tok = toks[i];
      var cont;
      switch (tok.charCodeAt(0)) {
        default:  // sign or digit
          cont = stack[0];
          cont[key || cont.length] = +(tok);
          key = void 0;
          break;
        case 0x22:  // '"'
          tok = tok.substring(1, tok.length - 1);
          if (tok.indexOf(this.SLASH) !== -1) {
            tok = tok.replace(this.escapeSequence, this.unescapeOne);
          }
          cont = stack[0];
          if (!key) {
            if (cont instanceof Array) {
              key = cont.length;
            } else {
              key = tok || this.EMPTY_STRING;  // Use as key for next value seen.
              break;
            }
          }
          cont[key] = tok;
          key = void 0;
          break;
		case 95: // '_'
		  cont = stack[0];
      if(funcContainer[tok].match(/^function/)){
		    cont[key || cont.length] = this.createFunction(funcContainer[tok]);
      } else if(funcContainer[tok].match(/^regex/)){
        cont[key || cont.length] = this.createRegex(funcContainer[tok]);
      }
      
		  key = void 0;		 
		 break;	
        case 0x5b:  // '['
          cont = stack[0];
          stack.unshift(cont[key || cont.length] = []);
          key = void 0;
          break;
        case 0x5d:  // ']'
          stack.shift();
          break;
        case 0x66:  // 'f'
		  cont = stack[0];
		  cont[key || cont.length] = false;
		  key = void 0;
          break;
        case 0x6e:  // 'n'
          cont = stack[0];
          cont[key || cont.length] = null;
          key = void 0;
          break;
        case 0x74:  // 't'
          cont = stack[0];
          cont[key || cont.length] = true;
          key = void 0;
          break;
        case 0x7b:  // '{'
          cont = stack[0];
          stack.unshift(cont[key || cont.length] = {});
          key = void 0;
          break;
        case 0x7d:  // '}'
          stack.shift();
          break;
      }
    }

    if (topLevelPrimitive) {
      if (stack.length !== 1) { throw new Error(); }
      result = result[0];
    } else {
      if (stack.length) { throw new Error(); }
    }

    return result;
  }, 
  ajax : {
	x:function(){try{return new ActiveXObject('Msxml2.XMLHTTP')}catch(e){try{return new ActiveXObject('Microsoft.XMLHTTP')}catch(e){return new XMLHttpRequest()}}},
    nocache : function(t){t.setRequestHeader("Cache-Control", "no-cache");t.setRequestHeader("If-Modified-Since", "Wed, 31 Dec 1980 00:00:00 GMT");t.setRequestHeader("Expires", "Wed, 31 Dec 1980 00:00:00 GMT");},	
    get : function(url){var jstr=jsonPlus.ajax.gets(url);return jstr;},
    gets : function(url,elm){var x=jsonPlus.ajax.x();x.open('GET',url,false);x.send(null);return x.responseText},
	json : function(url){var jstr=jsonPlus.ajax.gets(url);return eval('('+jstr+')');},
	send : function(u,f,m,a,nc){var x=jsonPlus.ajax.x();x.open(m,u,true);x.onreadystatechange=function(){if(x.readyState==4)f(x.responseText)};if(m=='POST')x.setRequestHeader('Content-type','application/x-www-form-urlencoded');if(nc)jsonPlus.ajax.nocache(x);x.send(a);return x.responseText},
	post : function(url,func,args){jsonPlus.ajax.send(url,func,'POST',args)}
  }
  
};
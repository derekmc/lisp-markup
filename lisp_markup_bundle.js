(function(){if(typeof module==="undefined"){this["LispMarkup"]=defineExports()}else{module.exports=defineExports()}var D=defaultValue;function defaultValue(default_value,value){if(value===null||value===undefined){return default_value}return value}function htmlDoubleQuoteEscape(s){return s.replace(/\"/g,"&quot;")}function logThrow(msg){console.error.apply(null,arguments);throw new Error(msg)}function defineExports(){var exports={};function T(){return arguments[arguments.length-1]}var lispToHtml=customTagMarkupConverter(htmlTagHandler);exports.htmlTagHandler=htmlTagHandler;exports.lispTree=lispTree;exports.customTagMarkupConverter=customTagMarkupConverter;exports.toHtml=toHtml;exports.compileTemplate=compileTemplate;exports.addMacro=addMacro;exports.addFunction=addFunction;exports.hasMacro=hasMacro;var macros=defineMacros();exports.macros={};for(var k in macros){exports.macros[k]=macros[k]}return exports;function addFunction(function_name,func){addMacro(function_name,makeMacro(func));function makeMacro(f){return function(l,data,markupConverter){var args=[];for(var i=1;i<l.length;++i){args.push(markupConverter(l[i],data))}return f.apply(null,args)}}}function addMacro(macro_name,macro_func){if(macros.hasOwnProperty(macro_name)){logThrow("LispMarkup.addMacro: macro '"+macro_name+"' already exists.")}macros[macro_name]=macro_func;exports.macros[macro_name]=macro_func}function hasMacro(macro_name){return macros.hasOwnProperty(macro_name)}function compileTemplate(template,taghandler){if(typeof template=="string"){template=lispTree(template)}if(!Array.isArray(template)){logThrow("LispMarkup.compileTemplate: Template must be a lisp tree or an array.",template)}var converter;if(taghandler){converter=customTagMarkupConverter(taghandler)}else{converter=lispToHtml}return function(data){return converter(template,data)}}function toHtml(template,data){if(typeof template=="string"){return lispToHtml(lispTree(template),data)}else if(Array.isArray(template)){return lispToHtml(template,data)}}function htmlTagHandler(tagstr,props){T("",tagstr);T(undefined,{},props);if(!props)props={};var open_parts=["<"],i=0,j=0,class_list=[],tagname="",current_symbol="tag";function next_symbol(){var x=tagstr.substr(i,j-i);if(current_symbol=="tag"){tagname=x}if(current_symbol=="id"){props.id=x}if(current_symbol=="class"){class_list.push(x)}i=j+1}for(;j<tagstr.length;++j){var c=tagstr[j];if(c=="#"){next_symbol();current_symbol="id"}if(c=="."){next_symbol();current_symbol="class"}}if(j>i){next_symbol()}if(tagname.length==0){tagname="div"}open_parts.push(tagname);var proplist=[];for(var k in props){proplist.push(k,props[k])}for(var i=0;i<proplist.length-1;i+=2){var propname=proplist[i];var propvalue=proplist[i+1];if(propvalue===null||propvalue===undefined){open_parts.push(" ",propname)}else{open_parts.push(" ",propname,'="',htmlDoubleQuoteEscape(propvalue),'"')}}if(class_list.length){open_parts.push(' class="');for(var i=0;i<class_list.length;++i){open_parts.push(" "+class_list[i])}open_parts.push('"')}open_parts.push(">");var open=open_parts.join(""),close="</"+tagname+">";return[open,close]}function lispTree(s){var root=[];var node=root;var next;var parenStack=[];var nodeStack=[root];var matchingParens={"(":")","{":"}"};var parenNode={"(":function(){return[]},"{":function(){return{}}};var openParens=["(","{"];var closeParens=[")","}"];var lastKey=null;var handleToken=function(node,token){if(Array.isArray(node)){node.push(token);lastKey=null}else if(typeof node=="object"){if(lastKey===null){lastKey=token}else{node[lastKey]=token;lastKey=null}}};for(var i=0,j=0;i<s.length;++i){var c=s[i];if(c=="\\"){if(i==s.length-1){logThrow("lispTree: '\\' is last character","token, node, root, s:",s.substring(j,i),node,root,s)}s=s.substring(0,i)+s.substring(i+1);continue}if(c=="'"){var standalone=i==j;while(s[++i]!="'"){if(i==s.length){logThrow("lispTree: unterminated string","token, node, root, s:",s.substring(j,i),node,root,s)}if(s[i]=="\\")++i}if(standalone&&(i==s.length-1||s[i+1].match(/[\s(){}]/))){handleToken(node,s.substring(j+1,i));j=i+1}}if(c=='"'){var standalone=i==j;while(s[++i]!='"'){if(i==s.length){logThrow("lispTree: unterminated string","token, node, root, s:",s.substring(j,i),node,root,s)}if(s[i]=="\\")++i}if(standalone&&(i==s.length-1||s[i+1].match(/[\s(){}]/))){handleToken(node,s.substring(j+1,i));j=i+1}}for(var k=0;k<openParens.length;++k){var p=openParens[k];if(c==p){if(i>j)handleToken(node,s.substring(j,i));node.push(next=parenNode[p]());nodeStack.push(node);node=next;j=i+1;parenStack.push(p)}}for(var k=0;k<closeParens.length;++k){var p=closeParens[k];if(c==p){var open=parenStack.pop();if(p!=matchingParens[open]){logThrow("lispTree: mismatched parentheses "+open+", "+p)}if(i>j)handleToken(node,s.substring(j,i));if(node==root){logThrow("lispTree: xtra ')'","token, node, root, s:",s.substring(j,i),node,root,s)}node=nodeStack.pop();j=i+1}}if(c.match(/\s/)){if(i>j)handleToken(node,s.substring(j,i));while(i<s.length&&s[i].match(/\s/))++i;j=i;--i}}if(node!=root){logThrow("lispTree: xtra '('","token, node, root, s:",s.substring(j,i),node,root,s)}if(i>j)root.push(s.substring(j,i));return root}function customTagMarkupConverter(taghandler){if(typeof taghandler!="function"){logThrow("LispMarkup markup conversion function: taghandler argument must be a function")}return markupConverter;function markupConverter(l,data){data=D({},data);var props={};var first=l[0];var tagname=null;var result_parts=[""];if(l===null||l===undefined){return""}if(typeof l=="string"||typeof l=="number"){return l.toString()+" "}if(typeof first=="string"){if(macros.hasOwnProperty(first)){first=macros[first]}else{tagname=first}}if(typeof first=="function"){var macro=first;var macro_result=macro(l,data,markupConverter);if(typeof macro_result=="string"){return macro_result}else if(Array.isArray(macro_result)){return markupConverter(macro_result,data)}else if(typeof macro_result=="object"&&macro_result.constructor=={}.constructor){return macro_result}else if(!macro_result){return""}else{return macro_result.toString()}}for(var i=0;i<l.length;++i){if(i==0&&tagname)continue;var x=l[i];if(Array.isArray(x)){var result=markupConverter(x,data);if(typeof result=="object"&&result.constructor=={}.constructor){for(var k in result){var property_value=result[k];if(Array.isArray(property_value)){props[k]=markupConverter(property_value,data)}else if(typeof property_value=="string"||typeof property_value=="number"){props[k]=property_value}else if(property_value===null||property_value===undefined){props[k]=null}else{logThrow("LispMarkup: illegal property value type.")}}}else{result_parts.push(result)}}else if(typeof x=="object"){for(var k in x){var property_value=x[k];if(Array.isArray(property_value)){props[k]=markupConverter(property_value,data)}else if(typeof property_value=="string"||typeof property_value=="number"){props[k]=property_value}else if(property_value===null||property_value===undefined){props[k]=null}else if(typeof property_value=="function"){var view=property_value;var view_result=view(data);if(typeof view_result=="string"){props[k]=view_result+" "}else if(!view_result){props[k]=""}else{logThrow("LispMarkup markup conversion function: template returned value with invalid type.")}}else{logThrow("LispMarkup: illegal property value type.")}}}else if(typeof x=="function"){var view=x;var view_result=view(data);if(typeof view_result=="string"){result_parts.push(view_result+" ")}else if(!view_result){result_parts.push("")}else{logThrow("LispMarkup markup conversion function: template returned value with invalid type.")}}else{if(x)result_parts.push(x.toString()+" ")}}if(tagname){var tags=taghandler(tagname,props);result_parts[0]=tags[0];result_parts.push(tags[1])}return result_parts.join("")}}}function defineMacros(){var macros={};macros.WITH=_with;macros.COMMENT=comment;macros.CONCAT=concat;macros.CONCAT_SPACE=concat_space;macros.IF=_if;macros.GET=get;macros.CSS=css;macros.LET=_let;macros.FOR=_for;macros.STRINGIFY=_stringify;macros.PROPERTIES=properties;macros.PROPS=properties;macros["?"]=_if;macros["@"]=get;macros[".."]=concat;macros["..."]=concat_space;macros["##"]=comment;macros[":"]=properties;macros["="]=_let;var int_regex=/^(0|[-]?[1-9][0-9]*)$/;var number_regex=/^(0|[-]?[1-9][0-9]*)(\.[0-9]+){0,1}$/;var variable_regex=/^\$[_a-zA-Z0-9]+$/;return macros;function properties(l,data,markupConverter){var props={};for(var i=1;i<l.length-1;i+=2){props[l[i]]=l[i+1]}return props}function _stringify(l,data,markupConverter){if(l.length==1){return JSON.stringify(data)}if(l.length==2){return JSON.stringify(data[l[1]])}logThrow("LispMarkup.macros.STRINGIFY: only 0 or 1 arguments allowed.")}function _if(l,data,markupConverter){var result_parts=[];if(l.length<3||l.length>4){logThrow("LispMarkup.macros._if invalid number of arguments",l.length,l)}var test=l[1];var test_result=false;if(typeof test=="function"){test_result=test(data)}else if(typeof test=="string"||typeof test=="number"){test_result=data?data[test]:false}else if(typeof test=="boolean"){test_result=test}else if(!isNaN(test)){test_result=test!=0}else{logThrow("LispMarkup.macros._if invalid type for context argument")}if(test_result){return markupConverter(l[2],data,markupConverter)}else if(l.length>3){return markupConverter(l[3],data,markupConverter)}else return""}function _with(l,data,markupConverter){var result_parts=[];if(l.length<3){logThrow("LispMarkup.macros._with not enough list arguments")}var context=l[1];if(data===null||data==="undefined"){logThrow("LispMarkup.macros._with data is not defined")}if(typeof context=="function"){data=context(data)}else if(typeof context=="string"||typeof context=="number"){data=data[context]}else{logThrow("LispMarkup.macros._with invalid type for context argument")}for(var i=2;i<l.length;++i){result_parts.push(markupConverter(l[i],data,markupConverter))}return result_parts.join("")}function comment(l,data,markupConverter){return""}function isInteger(x){if(typeof x=="string"){return x.match(int_regex)}if(typeof x!="number"){return false}var epsilon=1e-6;var error=x-Math.round(x);if(error>epsilon||-error<-epsilon){return false}return true}function _for(l,data,markupConverter){if(l.length<4){logThrow("LispMarkup.macros.FOR: at least 3 arguments required.")}var variable_argument=l[1];var range_or_data_argument=l[2];var ref_variable=null;var value_variable=null;if(Array.isArray(variable_argument)){if(variable_argument.length==0){}else if(variable_argument.length<3){var ref_variable_obj=variable_argument.length==2?variable_argument[0]:null;var value_variable_obj=variable_argument[variable_argument.length-1];if(ref_variable_obj!=null&&ref_variable_obj!=undefined){if(typeof ref_variable_obj!="string"){logThrow("LispMarkup.macros.FOR: reference variable declaration not a string.",ref_variable_obj)}if(ref_variable_obj[0]!="$"){logThrow("LispMarkup.macros.FOR: reference variable should begin with '$'",ref_variable_obj)}}if(value_variable_obj==null||value_variable_obj==undefined){logThrow("LispMarkup.macros.FOR: value variable unexpectedly null or undefined.")}if(typeof value_variable_obj!="string"){logThrow("LispMarkup.macros.FOR: value variable declaration not a string.",ref_variable_obj)}if(value_variable_obj[0]!="$"){logThrow("LispMarkup.macros.FOR: reference variable should begin with '$'",ref_variable_obj)}if(!value_variable_obj.match(variable_regex)){logThrow("LispMarkup.macros.FOR: variable name not valid",value_variable_obj)}ref_variable=ref_variable_obj.substring(1);value_variable=value_variable_obj.substring(1)}else{logThrow("LispMarkup.macros.FOR: variable_argument list may not have more than 2 entries",variable_argument,l)}}else if(typeof variable_argument=="string"){if(variable_argument.length==0){logThrow("LispMarkup.macros.FOR: variable_argument unexpectedly an empty string.")}if(variable_argument[0]!="$"){logThrow("LispMarkup.macros.FOR: variable_argument was a string, must be a '$' prefixed variable name")}if(!variable_argument.match(variable_regex)){logThrow("LispMarkup.macros.FOR: variable name not valid",variable_argument)}value_variable=variable_argument.substring(1)}else{logThrow("LispMarkup.macros.FOR: variable_argument must be a list or a string.",variable_argument)}var is_range=false;var start=1;var end=1;var increment=1;var data_key=null;if(Array.isArray(range_or_data_argument)){var range_or_data_list=range_or_data_argument;if(range_or_data_list.length==0){}else if(range_or_data_list.length==1){var arg=range_or_data_list[0];if(!isInteger(arg)){logThrow("LispMarkup.macros.FOR: single range argument must be an integer.",arg,range_or_data_argument)}is_range=true;var n=parseInt(arg);start=n>0?1:-1;end=n}else if(range_or_data_list.length==2){var arg0=range_or_data_list[0];var arg1=range_or_data_list[1];if(isNaN(arg0)||isNaN(arg1)){logThrow("LispMarkup.macros.FOR: range start or end not a number.")}is_range=true;start=parseFloat(arg0);end=parseFloat(arg1)}else if(range_or_data_list.length==3){var arg0=range_or_data_list[0];var arg1=range_or_data_list[1];var arg2=range_or_data_list[2];if(isNaN(arg0)||isNaN(arg1)||isNaN(arg2)){logThrow("LispMarkup.macros.FOR: range start or end not a number.")}is_range=true;start=parseFloat(arg0);end=parseFloat(arg1);increment=parseFloat(arg2)}else{logThrow("LispMarkup.macros.FOR: range argument may only have 3 entries.")}}else if(typeof range_or_data_argument=="string"){if(int_regex.test(range_or_data_argument)){is_range=true;start=1;end=parseInt(range_or_data_argument)}else if(range_or_data_argument.match(number_regex)){logThrow("LispMarkup.macros.FOR: single value range argument may not be non-integer number.",range_or_data_argument)}else{data_key=range_or_data_argument}}else if(typeof range_or_data_argument=="number"){if(!isInteger(range_or_data_argument)){logThrow("LispMarkup.macros.FOR: single value range argument may not be non-integer number.",range_or_data_argument)}is_range=true;start=1;end=Math.round(range_or_data_argument)}var rest=l.slice(3);var result_parts=[];var var_substitutions={};var loop=[];var loop_data=null;if(ref_variable!==null){var_substitutions[ref_variable]=""}if(value_variable!==null){var_substitutions[value_variable]=""}if(is_range){if(increment==0){logThrow("LispMarkup.macros.FOR: 0 increment not allowed",l)}if(start>end&&increment>0){increment=-increment}if(start<end&&increment<0){increment=-increment}for(var i=start;increment>0?i<=end:i>=end;i+=increment){var n=parseFloat(i.toFixed(12));loop.push([n,n])}}else{if(data_key){loop_data=D({},data?data[data_key]:null)}else{loop_data=D({},data)}if(Array.isArray(loop_data)){for(var i=0;i<loop_data.length;++i){loop.push([i+1,loop_data[i]])}}else if(typeof loop_data=="object"){for(var k in loop_data){loop.push([k,loop_data[k]])}}}for(var i=0;i<loop.length;++i){var ref=loop[i][0];var val=loop[i][1];var current_data=data;if(ref_variable!==null){var_substitutions[ref_variable]=ref}if(val!==null){if(value_variable!==null){var_substitutions[value_variable]=val}else{current_data=val}}var processed_rest=ref_variable!==null||value_variable!==null?substitute(rest,var_substitutions):rest;for(var j=0;j<processed_rest.length;++j){result_parts.push(markupConverter(processed_rest[j],current_data))}}return result_parts.join("")}function _let(l,data,markupConverter){var one=l[1];var assign_list;var substitutions={};if(l.length<3){logThrow("LispMarkup.macros.LET: At least 2 arguments are required")}if(Array.isArray(one)){assign_list=one}else{assign_list=[l[1],l[2]]}if(assign_list.length%2!=0){logThrow("LispMarkup.macros.LET: assignment list must be even length.")}for(var i=0;i<assign_list.length;i+=2){var k=assign_list[i],v=assign_list[i+1];if(Array.isArray(v)){v=markupConverter(v,data)}if(typeof k=="function"){v=v(data)}if(typeof k!="string"||typeof v!="string"){logThrow("LispMarkup.macros.LET: variable name was not a string.")}if(typeof k!="string"||typeof v!="string"){logThrow("LispMarkup.macros.LET: variable value not a string or convertible to string")}if(k.charAt(0)!="$"){logThrow("LispMarkup.macros.LET: variable must begin with '$'")}if(substitutions.hasOwnProperty(k)){logThrow("LispMarkup.macros.LET: variable '"+k+"' assigned previously in this let statement.")}substitutions[k.substring(1)]=v}var l=substitute(l.slice(Array.isArray(one)?2:3),substitutions);var result_parts=[];for(var i=0;i<l.length;++i){result_parts.push(markupConverter(l[i],data).toString())}return result_parts.join("")}function substitute(x,vars){if(typeof vars!="object"){logThrow("LispMarkup.substitute: vars must be an object map")}if(Array.isArray(x)){var result=[];for(var i=0;i<x.length;++i){result[i]=substitute(x[i],vars)}return result}if(typeof x=="object"){var result={};for(var k in x){result[k]=substitute(x[k],vars)}return x}if(typeof x=="string"){var result_parts=[];for(var i=0,k=0;i<x.length;++i){var c=x[i];if(c=="\\")++i;if(c=="'"){while(++i<x.length&&x[i]!="'"){if(x[i]=="\\")++i}}if(c=="$"){var j=i+1;var name="";++i;if(i<x.length&&x[i]=="{"){do{++i}while(i<x.length&&x[i]!="}");name=x.substring(j+1,i);++i;console.log(name)}else{while(i<x.length&&x[i].match(/[_0-9A-Za-z]/)){++i}name=x.substring(j,i)}if(name.length&&vars.hasOwnProperty(name)){result_parts.push(x.substring(k,j-1),vars[name]);k=i}}}result_parts.push(x.substring(k));return result_parts.join("")}return x}function concat(l,data,markupConverter){var result_parts=[""];for(var i=1;i<l.length;++i){var s=markupConverter(l[i],data);result_parts.push(s.toString().trim())}return result_parts.join("")}function concat_space(l,data,markupConverter){var result_parts=[""];for(var i=1;i<l.length;++i){var s=markupConverter(l[i],data);result_parts.push(s.toString())}return result_parts.join("")}function get(l,data,markupConverter){if(l.length==1){return data.toString()}else if(l.length==2){return data[l[1]]?data[l[1]].toString():""}else if(l.length==3){var value=data[l[1]];if(value===null||value===undefined){value=markupConverter(l[2],data,markupConverter)}return value.toString()}else{logThrow("LispMarkup.macros.get invalid number of list arguments")}}function css(l,data,markupConverter){var result_parts=["<style>"];for(var i=1;i<l.length;++i){result_parts.push(handleEntry(l[i]))}result_parts.push("</style>");return result_parts.join("");function handleRule(rule){var result_parts=[];if(typeof rule=="function"){rule=rule(data);if(typeof rule!="string"){logThrow("LispMarkup.macros.css: tranform function for css rule did not return a string value.")}result_parts.push(rule)}else if(typeof rule=="string"){result_parts.push(rule)}else if(Array.isArray(rule)){var first=rule[0];if(typeof first=="function"){return handleRule(first(rule,data,markupConverter))}if(typeof first=="string"){if(rule.length<2){logThrow("LispMarkup.macros.css: css rule must have at least 2 entries, a property and a value")}var property=first;var value_parts=[];for(var i=1;i<rule.length;++i){var value=rule[i];if(Array.isArray(value)){if(typeof value[0]!="function"){logThrow("LispMarkup.macros.css: if css rule value is a list, it must be a macro call.")}var newvalue=value[0](value,data,markupConverter);value_parts.push(newvalue)}else if(typeof value=="function"){value_parts.push(value(data))}else if(typeof value=="string"){value_parts.push(value)}else{logThrow("LispMarkup.macros.css: css rule value not a string, macro call, or view returning a string.")}}result_parts.push(property+": "+value_parts.join(" ")+"; ")}else{logThrow("LispMarkup.macros.css: css rule property not a string")}}return result_parts.join("")}function handleEntry(entry){var result_parts=[];if(typeof entry=="string"){result_parts.push(entry)}else if(typeof entry=="function"){entry=entry(data);if(typeof entry!="string"){logThrow("LispMarkup.macros.css: css entry view did not return a string")}result_parts.push(entry)}else if(Array.isArray(entry)){var first=entry[0];if(typeof first=="function"){return handleEntry(first(entry,data,markupConverter))}if(typeof first=="string"){var selector=first;result_parts.push(selector+"{");for(var i=1;i<entry.length;++i){var rule=entry[i];result_parts.push(handleRule(rule))}result_parts.push("}")}else{logThrow("LispMarkup.macros.css: invalid selector type")}}else{logThrow("LispMarkup.macros.css: invalid entry type")}return result_parts.join("")}}}})();var LispMarkupBrowser={};(function(){var templates={};var CONTAINER_SUFFIX="";var DATA_SUFFIX="_data";var CONTENT_SUFFIX=/-content$|-template$/;var SCRIPT_TYPE="text/lisp-markup";LispMarkupBrowser.setContentTemplate=setContentTemplate;LispMarkupBrowser.getContentTemplate=getContentTemplate;LispMarkupBrowser.updateAll=updateAll;LispMarkupBrowser.updateContainers=updateContainers;LispMarkupBrowser.getContainers=getContainers;LispMarkup.addMacro("SECTION",macroDefineTemplate);window.addEventListener("load",browserInit);return;function setContentTemplate(template_name,template){if(template===null||template==="undefined"){delete templates[template_name];return}if(typeof template=="string"){template=LispMarkup.compileTemplate(template)}if(typeof template!="function"){throw new Error("LispMarkupBrowser.setContentTemplate: Template must be a string in LispMarkup format or a function.")}templates[template_name]=template}function getContentTemplate(template_name){return templates[template_name]}function macroDefineTemplate(l,data,markupConverter){if(l.length<2){throw new Error("LispMarkupBrowser.macroDefineTemplate: at least 2 list entries required in template definition.")}var template_name=l[1];if(templates.hasOwnProperty(template_name)){console.warn("LispMarkupBrowser.macroDefineTemplate: template '"+template_name+"' already defined.")}var rest_of_list=l.slice(2);var template=LispMarkup.compileTemplate(rest_of_list);templates[template_name]=function(data){return template(data)}}function getContainers(container_name){var list=[];var key=container_name+CONTAINER_SUFFIX;var elems=document.getElementsByClassName(key);for(var i=0;i<elems.length;++i){list.push(elems[i])}var elem=document.getElementById(key);if(elem)list.push(elem);return list}function updateAll(datasets){if(datasets===null||datasets==undefined)datasets={};if(typeof datasets!="object"){throw new Error("LispMarkupBrowser.updateAll(): datasets parameter, if specified, must be an object.")}for(var name in templates){var list=getContainers(name);for(var i=0;i<list.length;++i){list[i].innerHTML=""}}var container_queue=[];var queued_container_set={};while(true){if(container_queue.length==0){var new_containers=false;for(var _container_name in templates){var container_list=getContainers(_container_name);if(container_list.length>0){if(!queued_container_set.hasOwnProperty(_container_name)){new_containers=true;container_queue.push(_container_name);queued_container_set[_container_name]=true}}}if(!new_containers){break}continue}var container_name=container_queue.shift();updateContainers(container_name,datasets[container_name])}}function updateContainers(container_name,data){var container_list=getContainers(container_name);if(container_list.length==0){console.warn("LispMarkupBrowser updateContainer(): no container with name '"+container_name+"'.")}if(data===undefined){var data_var_name=container_name+DATA_SUFFIX;if(data_var_name in window){data=window[data_var_name]}}for(var i=0;i<container_list.length;++i){var template=templates[container_name];container_list[i].innerHTML=template(data)}}function getScripts(){var scripts={};var elems=document.getElementsByTagName("script");for(var i=0;i<elems.length;++i){var elem=elems[i];var scriptid=elem.id;var type=elem.type;var value=elem.innerHTML;if(scriptid){scriptid=scriptid.replace(CONTENT_SUFFIX,"")}if(type==SCRIPT_TYPE){scripts[scriptid]=value}}return scripts}function browserInit(){console.log("init lisp_markup.js in browser.");if(!LispMarkup){throw"LispMarkup library not available."}var scripts=getScripts();for(var name in scripts){console.log("LispMarkupBrowser: Compiling template: "+name);templates[name]=LispMarkup.compileTemplate(scripts[name])}updateAll()}})();
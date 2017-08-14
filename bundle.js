!function(){function defineExports(){function T(){}function htmlTagHandler(tagstr,props){function next_symbol(){var x=tagstr.substr(i,j-i);"tag"==current_symbol&&(tagname=x),"id"==current_symbol&&(props.id=x),"class"==current_symbol&&class_list.push(x),i=j+1}T(tagstr,""),T(props,{},void 0),props||(props={});for(var open_parts=["<"],i=0,j=0,class_list=[],tagname="",current_symbol="tag";j<tagstr.length;++j){var c=tagstr[j];"#"==c&&(next_symbol(),current_symbol="id"),"."==c&&(next_symbol(),current_symbol="class")}j>i&&next_symbol(),0==tagname.length&&(tagname="div"),open_parts.push(tagname);var proplist=[];for(var k in props)proplist.push(k,props[k]);for(i=0;i<proplist.length-1;i+=2){var propname=proplist[i],propvalue=proplist[i+1];null===propvalue||void 0===propvalue?open_parts.push(" ",propname):open_parts.push(" ",propname,'="',propvalue,'"')}if(class_list.length){open_parts.push(' class="');for(i=0;i<class_list.length;++i)open_parts.push(" "+class_list[i]);open_parts.push('"')}return open_parts.push(">"),[open_parts.join(""),"</"+tagname+">"]}function lispTree(s){for(var next,root=[],node=root,i=0,j=0;i<s.length;++i){var c=s[i];if("\\"!=c){if("'"==c){for(standalone=i==j;"'"!=s[++i];){if(i==s.length)throw new Error("lispTree: unterminated string");"\\"==s[i]&&++i}standalone&&(i==s.length-1||s[i+1].match(/[\s()]/))&&(node.push(s.substring(j+1,i)),j=i+1)}if('"'==c){for(var standalone=i==j;'"'!=s[++i];){if(i==s.length)throw new Error("lispTree: unterminated string");"\\"==s[i]&&++i}standalone&&(i==s.length-1||s[i+1].match(/[\s()]/))&&(node.push(s.substring(j+1,i)),j=i+1)}if("("==c&&(i>j&&node.push(s.substring(j,i)),node.push(next=[]),next.parent=node,node=next,j=i+1),")"==c){if(i>j&&node.push(s.substring(j,i)),node==root)throw new Error("lispTree: xtra ')'");node=node.parent,j=i+1}if(c.match(/\s/)){for(i>j&&node.push(s.substring(j,i));i<s.length&&s[i].match(/\s/);)++i;j=i,--i}}else{if(i==s.length-1)throw new Error("lispTree: '\\' is last character");++i}}if(node!=root)throw new Error("lispTree: xtra '('");return i>j&&root.push(s.substring(j,i)),root}function customTagMarkupConverter(taghandler){function markupConverter(l,data){T([],"",0,l),T({},[],void 0,data);var props={},first=l[0],tagname=null,result_parts=[""];if(null===l||void 0===l)return"";if("string"==typeof l||"number"==typeof l)return l.toString()+" ";if("string"==typeof first&&(macros.hasOwnProperty(first)?first=macros[first]:tagname=first),"function"==typeof first){var macro_result=first(l,data,markupConverter);if("string"==typeof macro_result)return macro_result;if(Array.isArray(macro_result))return markupConverter(macro_result,data);if("object"==typeof macro_result&&macro_result.constructor=={}.constructor)return macro_result;if(macro_result)throw new Error("LispMarkup markup conversion function: macro returned value with invalid type.");return""}for(var i=0;i<l.length;++i)if(0!=i||!tagname){var x=l[i];if(Array.isArray(x)){var result=markupConverter(x,data);if("object"==typeof result&&result.constructor=={}.constructor){console.log("attributes ",result);for(var k in result){property_value=result[k];if(Array.isArray(property_value))props[k]=markupConverter(property_value,data);else if("string"==typeof property_value||"number"==typeof property_value)props[k]=property_value;else{if(null!==property_value&&void 0!==property_value)throw new Error("LispMarkup: illegal property value type.");props[k]=null}}}else result_parts.push(result)}else if("object"==typeof x)for(var k in x){var property_value=x[k];if(Array.isArray(property_value))props[k]=markupConverter(property_value,data);else if("string"==typeof property_value||"number"==typeof property_value)props[k]=property_value;else{if(null!==property_value&&void 0!==property_value)throw new Error("LispMarkup: illegal property value type.");props[k]=null}}else if("function"==typeof x){var view_result=x(data);if("string"==typeof view_result)result_parts.push(view_result+" ");else{if(view_result)throw new Error("LispMarkup markup conversion function: template returned value with invalid type.");result_parts.push("")}}else x&&result_parts.push(x.toString()+" ")}if(tagname){var tags=taghandler(tagname,props);result_parts[0]=tags[0],result_parts.push(tags[1])}return result_parts.join("")}if("function"!=typeof taghandler)throw new Error("LispMarkup markup conversion function: taghandler argument must be a function");return markupConverter}var exports={},lispToHtml=customTagMarkupConverter(htmlTagHandler);exports.htmlTagHandler=htmlTagHandler,exports.lispTree=lispTree,exports.customTagMarkupConverter=customTagMarkupConverter,exports.toHtml=function(template,data){return"string"==typeof template?lispToHtml(lispTree(template),data):Array.isArray(template)?lispToHtml(template,data):void 0},exports.compileTemplate=function(template,taghandler){if("string"==typeof template&&(template=lispTree(template)),!Array.isArray(template))throw new Error("LispMarkup.compileTemplate: Template must be a lisp tree or an array.");var converter;return converter=taghandler?customTagMarkupConverter(taghandler):lispToHtml,function(data){return converter(template,data)}},exports.addMacro=function(macro_name,macro_func){if(macros.hasOwnProperty(macro_name))throw new Error("LispMarkup.addMacro: macro '"+macro_name+"' already exists.");macros[macro_name]=macro_func,exports.macros[macro_name]=macro_func},exports.hasMacro=function(macro_name){return macros.hasOwnProperty(macro_name)};var macros=defineMacros();exports.macros={};for(var k in macros)exports.macros[k]=macros[k];return exports}function defineMacros(){function properties(l,data,markupConverter){for(var props={},i=1;i<l.length-1;i+=2)props[l[i]]=l[i+1];return props}function comment(l,data,markupConverter){return""}function _let(l,data,markupConverter){var data_copy=JSON.parse(JSON.stringify(data));if(l.length<3)throw new Error("LispMarkup.macros.LET: At least 2 arguments are required");var name=l[1],value=l[2];if(Array.isArray(name)?name=markupConverter(name,data,markupConverter):"function"==typeof name&&(name=name(data)),"string"!=typeof name)throw new Error("LispMarkup.macros.LET: Let name not a string or convertible to string.");if(Array.isArray(value)?value=markupConverter(value,data,markupConverter):"function"==typeof value&&(value=value(data)),"string"!=typeof value)throw new Error("LispMarkup.macros.LET: Let value not a string or convertible to string.");data_copy[name]=value;for(var result_parts=[],i=3;i<l.length;++i)result_parts.push(markupConverter(l[i],data_copy,markupConverter));return result_parts.join("")}function foreach(l,data,markupConverter){var _l,result_parts=[],datalist=[];if(2==l.length)datalist=data,_l=l[1];else{if(3!=l.length)throw new Error("LispMarkup.macros.FORINDEX: invalid number list of arguments");var listgetter=l[1];_l=l[2],"function"==typeof listgetter?datalist=listgetter(data):"string"==typeof listgetter&&(datalist=data[listgetter])}for(var i=0;i<datalist.length;++i){var item=datalist[i];result_parts.push(markupConverter(_l,item))}return result_parts.join("")}function concat(l,data,markupConverter){for(var result_parts=[""],i=1;i<l.length;++i){var s=markupConverter(l[i],data);result_parts.push(s.toString().trim())}return result_parts.join("")}function concat_space(l,data,markupConverter){for(var result_parts=[""],i=1;i<l.length;++i){var s=markupConverter(l[i],data);result_parts.push(s.toString())}return result_parts.join("")}function get(l,data,markupConverter){if(1==l.length)return data.toString();if(2==l.length)return data[l[1]].toString();if(3==l.length){var value=data[l[1]];return null!==value&&void 0!==value||(value=markupConverter(l[2],data,markupConverter)),value.toString()}throw new Error("LispMarkup.macros.get invalid number of list arguments")}var macros={};return macros.WITH=function(l,data,markupConverter){var result_parts=[];if(l.length<3)throw new Error("LispMarkup.macros._with not enough list arguments");var context=l[1];if(!data)throw new Error("LispMarkup.macros._with data is not defined");if("function"==typeof context)data=context(data);else{if("string"!=typeof context&&"number"!=typeof context)throw new Error("LispMarkup.macros._with invalid type for context argument");data=data[context]}for(var i=2;i<l.length;++i)result_parts.push(markupConverter(l[i],data,markupConverter));return result_parts.join("")},macros.COMMENT=comment,macros.FOREACH=foreach,macros.FORINDEX=function(l,data,markupConverter){var _l,result_parts=[],datalist=[];if(2==l.length)datalist=data,_l=l[1];else{if(3!=l.length)throw new Error("LispMarkup.macros.foreach invalid number list of arguments");var listgetter=l[1];_l=l[2],"function"==typeof listgetter?datalist=listgetter(data):"string"==typeof listgetter&&(datalist=data[listgetter])}for(var i=0;i<datalist.length;++i){var item=datalist[i],data_obj={INDEX:i+1,VALUE:item,I:i+1,VAL:item,X:item};result_parts.push(markupConverter(_l,data_obj))}return result_parts.join("")},macros.FOR=foreach,macros.CONCAT=concat,macros.CONCAT_SPACE=concat_space,macros.GET=get,macros.CSS=function(l,data,markupConverter){function handleRule(rule){var result_parts=[];if("function"==typeof rule){if("string"!=typeof(rule=rule(data)))throw new Error("LispMarkup.macros.css: tranform function for css rule did not return a string value.");result_parts.push(rule)}else if("string"==typeof rule)result_parts.push(rule);else if(Array.isArray(rule)){var first=rule[0];if("function"==typeof first)return handleRule(first(rule,data,markupConverter));if("string"!=typeof first)throw new Error("LispMarkup.macros.css: css rule property not a string");if(rule.length<2)throw new Error("LispMarkup.macros.css: css rule must have at least 2 entries, a property and a value");for(var property=first,value_parts=[],i=1;i<rule.length;++i){var value=rule[i];if(Array.isArray(value)){if("function"!=typeof value[0])throw new Error("LispMarkup.macros.css: if css rule value is a list, it must be a macro call.");var newvalue=value[0](value,data,markupConverter);value_parts.push(newvalue)}else if("function"==typeof value)value_parts.push(value(data));else{if("string"!=typeof value)throw new Error("LispMarkup.macros.css: css rule value not a string, macro call, or view returning a string.");value_parts.push(value)}}result_parts.push(property+": "+value_parts.join(" ")+"; ")}return result_parts.join("")}function handleEntry(entry){var result_parts=[];if("string"==typeof entry)result_parts.push(entry);else if("function"==typeof entry){if("string"!=typeof(entry=entry(data)))throw new Error("LispMarkup.macros.css: css entry view did not return a string");result_parts.push(entry)}else{if(!Array.isArray(entry))throw new Error("LispMarkup.macros.css: invalid entry type");var first=entry[0];if("function"==typeof first)return handleEntry(first(entry,data,markupConverter));if("string"!=typeof first)throw new Error("LispMarkup.macros.css: invalid selector type");var selector=first;result_parts.push(selector+"{");for(var i=1;i<entry.length;++i){var rule=entry[i];result_parts.push(handleRule(rule))}result_parts.push("}")}return result_parts.join("")}for(var result_parts=["<style>"],i=1;i<l.length;++i)result_parts.push(handleEntry(l[i]));return result_parts.push("</style>"),result_parts.join("")},macros.LET=_let,macros.STRINGIFY=function(l,data,markupConverter){if(1==l.length)return JSON.stringify(data);if(2==l.length)return JSON.stringify(data[l[1]]);throw new Error("LispMarkup.macros.STRINGIFY: only 0 or 1 arguments allowed.")},macros.PROPERTIES=properties,macros.PROPS=properties,macros["."]=get,macros[".."]=concat,macros["..."]=concat_space,macros["//"]=comment,macros[":"]=properties,macros["="]=_let,macros}"undefined"==typeof module?this.LispMarkup=defineExports():module.exports=defineExports()}();var LispMarkupBrowser={};!function(){function getContainers(container_name){for(var list=[],key=container_name+CONTAINER_SUFFIX,elems=document.getElementsByClassName(key),i=0;i<elems.length;++i)list.push(elems[i]);var elem=document.getElementById(key);return elem&&list.push(elem),list}function updateAll(datasets){if(null!==datasets&&void 0!=datasets||(datasets={}),"object"!=typeof datasets)throw new Error("LispMarkupBrowser.updateAll(): datasets parameter, if specified, must be an object.");for(var name in templates)for(var list=getContainers(name),i=0;i<list.length;++i)list[i].innerHTML="";for(var container_queue=[],queued_container_set={};;)if(0!=container_queue.length){var container_name=container_queue.shift();updateContainers(container_name,datasets[container_name])}else{var new_containers=!1;for(var _container_name in templates)getContainers(_container_name).length>0&&(queued_container_set.hasOwnProperty(_container_name)||(new_containers=!0,container_queue.push(_container_name),queued_container_set[_container_name]=!0));if(!new_containers)break}}function updateContainers(container_name,data){var container_list=getContainers(container_name);if(0==container_list.length&&console.warn("LispMarkupBrowser updateContainer(): no container with name '"+container_name+"'."),void 0===data){var data_var_name=container_name+DATA_SUFFIX;data_var_name in window&&(data=window[data_var_name],console.log(data))}for(var i=0;i<container_list.length;++i){var template=templates[container_name];container_list[i].innerHTML=template(data)}}function getScripts(){for(var scripts={},elems=document.getElementsByTagName("script"),i=0;i<elems.length;++i){var elem=elems[i],scriptid=elem.id,type=elem.type,value=elem.innerHTML;scriptid&&(scriptid=scriptid.replace(CONTENT_SUFFIX,"")),type==SCRIPT_TYPE&&(scripts[scriptid]=value)}return scripts}var templates={},CONTAINER_SUFFIX="-container",DATA_SUFFIX="_data",CONTENT_SUFFIX=/-content$|-template$/,SCRIPT_TYPE="text/lisp-markup";LispMarkupBrowser.setContentTemplate=function(template_name,template){if("string"==typeof template&&(template=LispMarkup.compileTemplate(template)),"function"!=typeof template)throw new Error("LispMarkupBrowser.setContentTemplate: Template must be a string in LispMarkup format or a function.");templates[template_name]=template},LispMarkupBrowser.getContentTemplate=function(template_name){return templates[template_name]},LispMarkupBrowser.updateAll=updateAll,LispMarkupBrowser.updateContainers=updateContainers,LispMarkupBrowser.getContainers=getContainers,window.addEventListener("load",function(){if(console.log("init lisp_markup.js in browser."),!LispMarkup)throw"LispMarkup library not available.";var scripts=getScripts();for(var name in scripts)console.log("LispMarkupBrowser: Compiling template: "+name),templates[name]=LispMarkup.compileTemplate(scripts[name]);updateAll()})}();
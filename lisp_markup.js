
/*
 * LispMarkup: a lisp based template language for markup with a focus on macros.
 * 
 * LispMarkup has built in markup conversion functions and you may create your own conversion
 * functions by providing a taghandler.  The markup conversion
 *
 * Built-In Conversions:
 *    toHtml: convert to html.
 *
 * To make a custom markup conversion function, use the following function.
 *
 * customTagMarkupConverter(taghandler):
 *   creates a custom markup conversion function using the provided taghandler function.
 * 
 * taghandler( tag_str,properties):
 *   returns [opentag_str, closetag_str]
 *
 * All markup conversion functions follow the following calling pattern.
 *
 *
 * markupConverter( list,data):
 *   list: the template, whether a lisp string or a javascript list datastructure, to be converted to markup.
 *     entries in list are handled accoring to the type of the entry:
 *       - lists within this list are evaluated recursively like in lisp.
 *       - objects are property sets which are added to current node in the markup.
 *       - a function in the first position of a list is a macro.
 *       - a function in a non-first position is a view function.
 *       - views in list are called with a data parameter which is the current context in the data.
 *          view( data);
 *          views must return a string.
 *       - macros in the template are called with the following parameters:
 *          macro( template,data,markupConverter);
 *            - list: the current list this macro is applied to,
 *                 which will include the macro itself in the first position.
 *            - data: for templating, this is the same parameter that is passed to markupConverter( list,data), see more below.
 *            - markupConverter: macros are provided the current markupConverter function so they can do more magic.
 *
 *            The macro's return value is used in place of the original list with the macro.
 *            If it returns a string, that string is inserted into the markup.
 *            If it returns a list, the list is evaluated by the markupConverter
 *            If it returns an object, the properties are added to the current node in the markup.
 *            It may not return a function.
 *   data:
 *     this parameter allows your list datastructure to be used as a template.
 *     the values in the final markup are filled in with the data values from this list.
 *     Both tranformation and macro functions within list are passed this parameter as described above.
 */ 

(function(){  // scope

if(typeof module === 'undefined'){
    this['LispMarkup'] = defineExports(); }
else{
    module.exports = defineExports(); 
}


var D = defaultValue;
function defaultValue(default_value, value){
    if(value === null || value === undefined){
        return default_value; }
    return value;
}
function htmlDoubleQuoteEscape(s){
    // remove outer quotes.
    // if(s[0] = '"' && s[s.length-1] == '"') s = s.substring(1, s.length-1);
    return s.replace(/\"/g, '&quot;');
}

// logs several arguments, throws with just the message
// logThrow(msg, debug_args...)
function logThrow(msg){
    console.error.apply(null, arguments);
    throw new Error(msg);
}



function defineExports(){
    var exports = {};
    // TODO use real typecheck module
    function T(){ return arguments[arguments.length-1]; }

    var lispToHtml = customTagMarkupConverter(htmlTagHandler); 
    /* htmlTagHandler: process html tags
     * parses tagname and optionally id and classes
     * id starts with a hash "#"
     * classes start with a period "."
     *
     * returns [opentag, closetag]
     */

    exports.htmlTagHandler = htmlTagHandler;
    exports.lispTree = lispTree;
    exports.customTagMarkupConverter = customTagMarkupConverter;
    exports.toHtml = toHtml;
    exports.compileTemplate = compileTemplate;
    exports.addMacro = addMacro;
    exports.addFunction = addFunction;
    exports.hasMacro = hasMacro;

    var macros = defineMacros();
    exports.macros = {};
    for(var k in macros){ // copy macros for external object, but don't expose original.
        exports.macros[k] = macros[k]; }

    // =========== Last Procedural Statement in Module ==============
    return exports;




    function addFunction(function_name, func){
        addMacro(function_name, makeMacro(func));
        function makeMacro(f){
            return function( list,data,markupConverter){
                var args = [];
                for(var i=1; i<list.length; ++i){
                    args.push(markupConverter(list[i], data)); }
                //console.log("function", function_name, args);
                return f.apply(null, args);
            }
        }
    }
        
    function addMacro(macro_name, macro_func){
        if(macros.hasOwnProperty(macro_name)){
            logThrow("LispMarkup.addMacro: macro '" + macro_name + "' already exists."); }
        macros[macro_name] = macro_func;
        exports.macros[macro_name] = macro_func;
    }
    function hasMacro(macro_name){
        return macros.hasOwnProperty(macro_name);
    }

    function compileTemplate(template, taghandler){
        if(typeof template == "string"){
            template = lispTree(template); }
        if(!Array.isArray(template)){
            logThrow("LispMarkup.compileTemplate: Template must be a lisp tree or an array.", template); }
        //console.log(JSON.stringify(template));
        var converter;
        if(taghandler){
            converter = customTagMarkupConverter(taghandler); }
        else{
            converter = lispToHtml; }
        return function(data){
            return converter(template, data); }
    }
    function toHtml(template, data){
        if(typeof template == 'string'){
            return lispToHtml(lispTree(template), data); }
        else if(Array.isArray(template)){
            return lispToHtml(template, data); }
    }
    
    // uses a shorthand language for element tagname, id, and (css) classes:
    //   tagname#id.class1.class2
    function htmlTagHandler(tagstr, props){
        T("", tagstr);
        T(undefined, {}, props);
        if(!props) props = {}
        var open_parts = ["<"],
            i = 0,
            j = 0,
            class_list = [],
            tagname = "",
            current_symbol = 'tag'; // 'tag' | 'id' | 'class'
        function next_symbol(){ // closure
            var x = tagstr.substr(i,j-i);
            if(current_symbol == 'tag'){
                tagname = x; }
            if(current_symbol == 'id'){
                props.id = x; }
            if(current_symbol == 'class'){
                class_list.push(x); }
            i = j + 1; }
        for( ; j <tagstr.length; ++j){
            var c = tagstr[j];
            if(c == "#"){
                next_symbol();
                current_symbol = 'id'; }
            if(c == "."){
                next_symbol();
                current_symbol = 'class'; }}
        if(j > i){
            next_symbol(); }
        if(tagname.length == 0){
            tagname = "div"; }
        open_parts.push(tagname);
        var proplist = [];
        // make proplist
        for(var k in props){
            proplist.push(k, props[k]); }
        for(var i=0; i<proplist.length-1; i += 2){
            var propname = proplist[i];
            var propvalue = proplist[i+1];
            if(propvalue === null || propvalue === undefined){
                open_parts.push(" ", propname); }
            else{
                open_parts.push(" ", propname, "=\"", htmlDoubleQuoteEscape(propvalue), "\""); }}
        if(class_list.length){
            open_parts.push(" class=\"");
            for(var i=0; i<class_list.length; ++i){
                open_parts.push(" " + class_list[i]); }
            open_parts.push("\""); }
        open_parts.push(">");
        var open = open_parts.join(''),
            close = "</" + tagname + ">";
        return [open, close];
    }
    function lispTree(s){
        var root = [];
        var node = root;
        var next;
        var parenStack = [];
        var nodeStack = [root];
        // '(' and '[' both denote lists
        // but must match ')' and ']' respectively.
        var matchingParens = {
            '(': ')', '[': ']', '{': '}' };
        var parenNode = {
            '(': function(){ return []; },
            '[': function(){ return []; },
            '{': function(){ return {}; },
        }
        var openParens = ['(', '[', '{'];
        var closeParens = [')', ']', '}'];

        
        var lastKey = null;
        var handleToken = function(node, token){
            if(Array.isArray(node)){
                node.push(token);
                lastKey = null;
            } else if(typeof node == "object"){
                if(lastKey === null){
                    lastKey = token;
                } else {
                    node[lastKey] = token;
                    lastKey = null;
                }
            }
        }
        for(var i=0,j=0; i<s.length; ++i){
            var c = s[i];
            if(c == "\\"){
                if(i==s.length-1){
                    logThrow("lispTree: '\\' is last character", "token, node, root, s:", s.substring(j,i), node, root, s); }
                s = s.substring(0,i) + s.substring(i+1);
                continue; }
            if(c == "\'"){
                var standalone = (i==j);
                while(s[++i] != "\'"){
                    if(i == s.length){
                        logThrow("lispTree: unterminated string","token, node, root, s:", s.substring(j,i), node, root, s); }
                    if(s[i] == "\\") ++i; }
                if(standalone && (i == s.length-1 || s[i+1].match(/[\s\(\)\{\}]/))){
                    handleToken(node, s.substring(j+1,i));
                    j = i+1; }}
            if(c == "\""){
                var standalone = (i==j);
                while(s[++i] != "\""){
                    if(i == s.length){
                        logThrow("lispTree: unterminated string", "token, node, root, s:", s.substring(j,i), node, root, s); }
                    if(s[i] == "\\") ++i; }
                if(standalone && (i == s.length-1 || s[i+1].match(/[\s\(\)\{\}]/))){
                    handleToken(node, s.substring(j+1,i));
                    j = i+1; }}
            if(c == "$"){
                if(s[i+1] == "{"){
                    ++i;
                    while(s[++i] != "}"){
                        if(i == s.length){
                            logThrow("lispTree: unterminated interpolated varialbe", "token, node, root, s:", s.substring(j,i), node, root, s); }
                        if(s[i] == "\\") ++i; }}}
            for(var k=0; k<openParens.length; ++k){
                var p = openParens[k];
                if(c == p[0]){
                    if(i > j) handleToken(node, s.substring(j,i));
                    node.push(next = parenNode[p]());
                    nodeStack.push(node);
                    node = next;
                    j = i+1;
                    parenStack.push(p); }
            }
            for(var k=0; k<closeParens.length; ++k){
                var p = closeParens[k];
                if(c == p){
                    var open = parenStack.pop();
                    if(p != matchingParens[open]){
                        logThrow("lispTree: mismatched parentheses " + open + ", " + p); }
                    if(i > j) handleToken(node, s.substring(j,i));
                    if(node == root){
                        logThrow("lispTree: xtra paren " + open, "token, node, root, s:", s.substring(j,i), node, root, s); }
                    node = nodeStack.pop();
                    //node = node.parent;
                    j = i+1;
                }
            }
            if(c.match(/\s/)){
                if(i > j) handleToken(node, s.substring(j,i));
                while(i<s.length && s[i].match(/\s/)) ++i;
                j = i;
                --i;
            }
        }
        if(node != root){
            logThrow("lispTree: xtra '('", "token, node, root, s:", s.substring(j,i), node, root, s); }
        if(i > j) root.push(s.substring(j,i));
        return root;
    }
    
    function customTagMarkupConverter(taghandler){
        if(typeof taghandler != "function"){
            logThrow("LispMarkup markup conversion function: taghandler argument must be a function"); }
        
        // TODO make sure the right 'markupConverter' closure, with access to the proper taghandler is used for all recursive calls.
        // Some test cases would be nice.
        return markupConverter;  
        function markupConverter(list, data){
            //T([], "", 0, list);
            data = D({}, data); //T({}, [], D({}, data));
            var props = {};
            var first = list[0];
            var tagname = null;
            var result_parts = [''];  //save space for opening tag
            if(list === null || list === undefined){
                return ""; }
            if(typeof list == "string" || typeof list == "number"){
                return list.toString() + " "; }
            if(typeof first == "string"){
                if(macros.hasOwnProperty(first)){
                    first = macros[first]; }
                else{
                    tagname = first; }}
            if(typeof first == "function"){
                // first is a macro
                var macro = first;
                var macro_result = macro( list,data,markupConverter);
                if(typeof macro_result == "string"){
                    return macro_result; }
                else if(Array.isArray(macro_result)){
                    return markupConverter(macro_result, data); }
                else if(typeof macro_result == "object" && macro_result.constructor == ({}).constructor){
                    return macro_result;
                }
                else if(!macro_result){
                    return ""; }
                else{
                    return macro_result.toString(); }
                    //logThrow("LispMarkup markup conversion function: macro returned value with invalid type."); }
                // returned
            }

            for(var i=0; i<list.length; ++i){
                if(i==0 && tagname) continue; //skip tag
                var x = list[i];
                if(Array.isArray(x)){
                    var result = markupConverter(x, data);
                    if(typeof result == "object" && result.constructor == ({}).constructor){
                        //console.log("attributes ", result);
                        for(var k in result){
                            var property_value = result[k];
                            if(Array.isArray(property_value)){
                                props[k] = markupConverter(property_value, data); }
                            else if(typeof property_value == 'string' || typeof property_value == 'number'){
                                props[k] = property_value; }
                            else if(property_value === null || property_value === undefined){
                                props[k] = null; }
                            else{
                                logThrow("LispMarkup: illegal property value type."); }}}
                    else{
                        // TODO typecheck
                        result_parts.push(result); }}
                else if(typeof x == "object"){
                    for(var k in x){
                        var property_value = x[k];
                        if(Array.isArray(property_value)){
                            props[k] = markupConverter(property_value, data); }
                        else if(typeof property_value == 'string' || typeof property_value == 'number'){
                            props[k] = property_value; }
                        else if(property_value === null || property_value === undefined){
                            props[k] = null; }
                        else if(typeof property_value == "function"){
                            if(k.indexOf('on')){  // event handler
                                props[k] = property_value; }
                            else{
                                // template view function
                                var view = property_value;
                                var view_result = view(data);
                                if(typeof view_result == "string"){
                                    props[k] = view_result + " "; }
                                else if(!view_result){
                                    props[k] = ""; }
                                else{
                                    logThrow("LispMarkup markup conversion function: template returned value with invalid type."); }}}
                        else{
                            logThrow("LispMarkup: illegal property value type."); }}}
                else if(typeof x == "function"){
                    // view function
                    var view = x;
                    var view_result = view(data);
                    if(typeof view_result == "string"){
                        result_parts.push(view_result + " "); }
                    else if(!view_result){
                        result_parts.push(""); }
                    else{
                        logThrow("LispMarkup markup conversion function: template returned value with invalid type."); }}
                else{
                     if(x) result_parts.push(x.toString() + " "); }
            }
            if(tagname){
                var tags = taghandler(tagname, props);
                result_parts[0] = tags[0];
                result_parts.push(tags[1]); }
            return result_parts.join('');
        }
    }
}

function defineMacros(){
    var macros = {};
    macros.WITH = _with;
    macros.COMMENT = comment;
    macros.CONCAT = concat;
    macros.CONCAT_SPACE = concat_space;
    macros.IF = _if;
    macros.GET = get;
    macros.CSS = css;
    macros.LET = _let;
    macros.FOR = _for;
    macros.STRINGIFY = _stringify;
    macros.PROPERTIES = properties;
    macros.PROPS = properties;
    macros["?"] = _if;
    macros["@"] = get;  // @varname for inline get, (parse time syntactic sugar?)
    macros[".."] = concat;
    macros["..."] = concat_space;
    macros["##"] = comment;
    macros[":"] = properties;
    macros["="] = _let;
    var int_regex = /^(0|[-]?[1-9][0-9]*)$/; // TODO generalize to numbers.
    var number_regex = /^(0|[-]?[1-9][0-9]*)(\.[0-9]+){0,1}$/;
    var variable_regex = /^\$[_a-zA-Z0-9]+$/;
    return macros;
    function properties( list,data,markupConverter){
        var props = {}
        for(var i=1; i<list.length-1; i+=2){
            props[list[i]] = list[i+1]; }
        return props;
    }
    
    function _stringify( list,data,markupConverter){
        if(list.length == 1){
            return JSON.stringify(data); }
        if(list.length == 2){
            return JSON.stringify(data[list[1]]); }
        logThrow("LispMarkup.macros.STRINGIFY: only 0 or 1 arguments allowed.");
    }
    function _if(list,data,markupConverter){
        var result_parts = [];
        if(list.length < 3 || list.length > 4){
            logThrow("LispMarkup.macros._if invalid number of arguments", list.length, list); }
        var test = list[1];
        var test_result = false;
        if(typeof test == "function"){
            test_result = test(data); }
        else if(typeof test == "string" || typeof test == "number"){
            test_result = data? data[test] : false; }
        else if(typeof test == "boolean"){
            test_result = test; }
        else if(!isNaN(test)){
            test_result = test != 0; }
        else{
            logThrow("LispMarkup.macros._if invalid type for context argument"); }
        if(test_result){
            return markupConverter(list[2], data, markupConverter); }
        else if(list.length > 3){
            return markupConverter(list[3], data, markupConverter); }
        else return "";
    }
    function _with( list,data,markupConverter){
        var result_parts = [];
        if(list.length < 3){
            logThrow("LispMarkup.macros._with not enough list arguments"); }
        var context = list[1];
        if(data === null || data === "undefined"){
            logThrow("LispMarkup.macros._with data is not defined"); }
        if(typeof context == "function"){
            data = context(data); }
        else if(typeof context == "string" || typeof context == "number"){
            data = data[context]; }
        else{
            logThrow("LispMarkup.macros._with invalid type for context argument"); }
        for(var i=2; i<list.length; ++i){
            result_parts.push(markupConverter( list[i],data,markupConverter)); }
        return result_parts.join("");
    }
    function comment( list,data,markupConverter){
        return "";
    }
    // if list[1] is array, it is a a list of FOR parameters,
    // otherwise, list[1] is the the only FOR parameter.
    // if the first parameter is not '$' prefixed, it is a selector,
    // the first $ prefixed parameter is the index or key.
    // the second $ prefixed parameter is the value.
    // if there is only 1 $ prefixed parameter, the value is used as the data context.
    //
    // FOR: loop over data or range.
    // (FOR variable_argument range_or_data_argument body...)
    // variable_argument:
    //   no variables: ()
    //   single variable: $x or ($s)
    //   two variables: ($key $value) or ($index $value) 
    // range_or_data_argument:
    //   range:
    //     limit // limit: number. Loop from 1 to limit inclusive
    //     (limit) // limit: number. Loop from 1 to limit inclusive
    //     (low high) // low,high: number. Loop from low to high, inclusive
    //     (low high step) // low,high,step: number. Loop from low, increase by step, until high is exceeded.
    //   data:
    //     () // loop over current data context.
    //     refname // a string reference in the current data context, for the data to loop over.
    //     (refname) // a string reference in the current data context, for the data to loop over.
    //     (list) //list: list. Evaluate 'list' and then use that as the range or data argument.
    //     
    //   
    function isInteger(x){
        if(typeof x == "string"){
            return x.match(int_regex); }
        if(typeof x != "number"){
            return false; }
        var epsilon = 0.000001;
        var error = x - Math.round(x);
        if(error > epsilon || -error < -epsilon){
            return false; }
        return true;
    }
    function _for( list,data,markupConverter){
        if(list.length < 4){
            logThrow("LispMarkup.macros.FOR: at least 3 arguments required."); }
        var variable_argument = list[1];
        var range_or_data_argument = list[2];

        var ref_variable = null;
        var value_variable = null;
        if(Array.isArray(variable_argument)){
            if(variable_argument.length == 0){}
            else if(variable_argument.length < 3){
                var ref_variable_obj = variable_argument.length == 2? variable_argument[0] : null;
                var value_variable_obj = variable_argument[variable_argument.length - 1];
                if(ref_variable_obj != null && ref_variable_obj != undefined){
                    if(typeof ref_variable_obj != "string"){
                        logThrow("LispMarkup.macros.FOR: reference variable declaration not a string.", ref_variable_obj); }
                    if(ref_variable_obj[0] != "$"){
                        logThrow("LispMarkup.macros.FOR: reference variable should begin with '$'", ref_variable_obj); }}
                if(value_variable_obj == null || value_variable_obj == undefined){
                    logThrow("LispMarkup.macros.FOR: value variable unexpectedly null or undefined."); }
                if(typeof value_variable_obj != "string"){
                    logThrow("LispMarkup.macros.FOR: value variable declaration not a string.", ref_variable_obj); }
                if(value_variable_obj[0] != "$"){
                    logThrow("LispMarkup.macros.FOR: reference variable should begin with '$'", ref_variable_obj); }
                if(!value_variable_obj.match(variable_regex)){
                    logThrow("LispMarkup.macros.FOR: variable name not valid", value_variable_obj); }
                ref_variable = ref_variable_obj.substring(1);
                value_variable = value_variable_obj.substring(1);
                //console.log("ref_variable", ref_variable);
                //console.log("value_variable", value_variable);
            }
            else{
                logThrow("LispMarkup.macros.FOR: variable_argument list may not have more than 2 entries", variable_argument, list);
            }
        }
        else if(typeof variable_argument == "string"){
            if(variable_argument.length == 0){
                logThrow("LispMarkup.macros.FOR: variable_argument unexpectedly an empty string."); }
            if(variable_argument[0] != "$"){
                logThrow("LispMarkup.macros.FOR: variable_argument was a string, must be a '$' prefixed variable name"); }
            if(!variable_argument.match(variable_regex)){
                logThrow("LispMarkup.macros.FOR: variable name not valid", variable_argument); }
            value_variable = variable_argument.substring(1);
        }
        else{
            logThrow("LispMarkup.macros.FOR: variable_argument must be a list or a string.", variable_argument);
        }

        var is_range = false;
        var start = 1;
        var end = 1;
        var increment = 1;
        var data_key = null;
        if(Array.isArray(range_or_data_argument)){  // number range
            var range_or_data_list = range_or_data_argument;
            if(range_or_data_list.length == 0){}
            else if(range_or_data_list.length == 1){
                var arg = range_or_data_list[0];
                if(!isInteger(arg)){
                    logThrow("LispMarkup.macros.FOR: single range argument must be an integer.", arg, range_or_data_argument);
                }
                is_range = true;
                var n = parseInt(arg)
                start = n > 0? 1 : -1;
                end = n;
            }
            else if(range_or_data_list.length == 2){
                var arg0 = range_or_data_list[0];
                var arg1 = range_or_data_list[1];
                if(isNaN(arg0) || isNaN(arg1)){
                    logThrow("LispMarkup.macros.FOR: range start or end not a number."); }
                is_range = true;
                start = parseFloat(arg0);
                end = parseFloat(arg1);
            }
            else if(range_or_data_list.length == 3){
                var arg0 = range_or_data_list[0];
                var arg1 = range_or_data_list[1];
                var arg2 = range_or_data_list[2];
                if(isNaN(arg0) || isNaN(arg1) || isNaN(arg2)){
                    logThrow("LispMarkup.macros.FOR: range start or end not a number."); }
                is_range = true;
                start = parseFloat(arg0);
                end = parseFloat(arg1);
                increment = parseFloat(arg2);
            }
            else{
                logThrow("LispMarkup.macros.FOR: range argument may only have 3 entries.");
            }
            //logThrow("Array based ranges or data arguments not yet implemented.");
        }
        else if(typeof range_or_data_argument == "string"){
            if(int_regex.test(range_or_data_argument)){ //(int_regex)){
                is_range = true;
                start = 1;
                // TODO check for overflow
                end = parseInt(range_or_data_argument); }
            else if(range_or_data_argument.match(number_regex)){
                logThrow("LispMarkup.macros.FOR: single value range argument may not be non-integer number.", range_or_data_argument); }
            else{
                data_key = range_or_data_argument; }
        }
        else if(typeof range_or_data_argument == "number"){
            if(!isInteger(range_or_data_argument)){
                logThrow("LispMarkup.macros.FOR: single value range argument may not be non-integer number.", range_or_data_argument); }
            is_range = true;
            start = 1;
            end = Math.round(range_or_data_argument);
        }

        var rest = list.slice(3);
        var result_parts = [];
        var var_substitutions = {};
        var loop = [];
        var loop_data = null;
        if(ref_variable !== null){
            var_substitutions[ref_variable] = ""; }
        if(value_variable !== null){
            var_substitutions[value_variable] = ""; }
        //else if(val_name !== null){
            //logThrow("LispMarkup.macros.FOR: loop value variable unexpectedly assigned when loop reference variable was not."); }

        if(is_range){
            if(increment == 0){
                logThrow("LispMarkup.macros.FOR: 0 increment not allowed", list); }
            if(start > end && increment > 0){
                increment = -increment; }
            if(start < end && increment < 0){
                increment = -increment; }
            for(var i=start; (increment>0)? i<=end : i>=end; i += increment){
                var n = parseFloat(i.toFixed(12));
                loop.push([n, n]); }}
        else{
            if(data_key){
                loop_data = D({}, data? data[data_key] : null); }
            else{
                loop_data = D({}, data); }
            if(Array.isArray(loop_data)){
                for(var i=0; i<loop_data.length; ++i){
                    loop.push([i+1, loop_data[i]]); }}
            else if(typeof loop_data == "object"){
                for(var k in loop_data){
                    loop.push([k, loop_data[k]]); }}}

        //console.log("start, end, increment", start, end, increment);
        for(var i=0; i<loop.length; ++i){
            var ref = loop[i][0];
            var val = loop[i][1];
            //console.log("ref, value: ", ref, val);
            var current_data = data;
            if(ref_variable !== null){
                var_substitutions[ref_variable] = ref; }
            if(val !== null){
                if(value_variable !== null){
                    var_substitutions[value_variable] = val; }
                else{
                    current_data = val; }}
            var processed_rest = (ref_variable !== null || value_variable !== null)? substitute(rest, var_substitutions) : rest;
            for(var j=0; j<processed_rest.length; ++j){
                result_parts.push(markupConverter(processed_rest[j], current_data)); }}
        return result_parts.join('');
    }


        /*
        //if(Array.isArray(
        var one = list[1];
        var params;
        var substitutions;
        var int_regex = /^(0|[-]?[1-9][0-9]*)$/;

        if(list.length < 2){
            logThrow("LispMarkup.macros.FOR: at least 1 arguments required."); }

        if(Array.isArray(one)){
            params = one; }
        else{
            params = [one]; }
        if(params.length < 1){
            logThrow("LispMarkup.macros.FOR: param list is empty."); }
        if(params.length > 4){
            logThrow("LispMarkup.macros.FOR: param list exceeds 4 maximum entries."); }

        var index = 0;
        var loop_data = D({}, data);
        var start = null, end = null, incr = 1;
        var p = params[index];
        if(Array.isArray(p)){
            p = markupConverter(p, data); }
        if(typeof p == "string"){
            if(p.match(int_regex)){
                ++index;
                var n = parseInt(p);
                if(n < 0){
                    start = n; end = -1; }
                else{
                    start = 1; end = n; }}}

        // if first param is not $ prefixed, it selects loop_data.
        if(index == 0 && (typeof p != "string" || p[0] != "$")){
            var context = p;
            ++index;
            if(loop_data === null || loop_data === undefined){
                logThrow("LispMarkup.macros.FOR: data is not defined"); }
            if(typeof context == "function"){
                loop_data = context(loop_data); }
            else if(typeof context == "string" || typeof context == "number"){
                loop_data = loop_data[context]; }
            else{
                logThrow("LispMarkup.macros.FOR: invalid type for context argument"); }
            loop_data = D({}, loop_data);
        }

        // check for integer end bounds and increment
        if(start !== null){
            if(index < params.length){
                var p = params[index];
                if(Array.isArray(p)){
                    p = markupConverter(p, data); }
                if(p.toString().match(int_regex)){
                    ++index;
                    start = end;
                    end = parseInt(p); 
                    if(index < params.length){
                        var p = params[index];
                        if(Array.isArray(p)){
                            p = markupConverter(p, data); }
                        if(p.match(int_regex)){
                            ++index;
                            incr = parseInt(p); }}}}
        }
        else if(!Array.isArray(loop_data) && typeof loop_data != "object"){
            console.error("not iterable", loop_data);
            logThrow("LispMarkup.macros.FOR: loop_data context can't be iterated over, not array or object"); }

        var ref_name = null, val_name = null;
        // ref variable
        if(index < params.length){
            var p = params[index]; // index or key
            ++index;
            if(typeof p != "string" || p[0] != "$"){
                console.error("expected '$' prefixed variable", p, index); 
                logThrow("LispMarkup.macros.FOR: expected '$' prefixed variable name for loop index or key"); }
            ref_name = p.substr(1);
        }
        // value variable
        if(start == null && index < params.length){
            var p = params[index];
            ++index;
            if(typeof p != "string" || p[0] != "$"){
                logThrow("LispMarkup.macros.FOR: expected '$' prefixed variable name for loop number"); }
            val_name = p.substr(1);
        }
    
        if(index != params.length){
            logThrow("LispMarkup.macros.FOR: not all arguments were used."); }

        var rest = list.slice(2);
        var result_parts = [];
        var vars = {};
        var loop = [];
        if(ref_name !== null){
            vars[ref_name] = "";
            if(val_name !== null){
                vars[val_name] = ""; }}
        else if(val_name !== null){
            logThrow("LispMarkup.macros.FOR: loop value variable unexpectedly assigned when loop reference variable was not."); }

        if(start !== null){
            if(start > end && incr > 0){
                incr = -incr; }
            //console.log("bounds: " + start + ", " +  end + ", " + incr);
            for(var i=start; incr>0? i<=end : i>=end; i += incr){
                loop.push([i, null]); }}
        else if(Array.isArray(loop_data)){
            for(var i=0; i<loop_data.length; ++i){
                loop.push([i+1, loop_data[i]]); }}
        else if(typeof loop_data == "object"){
            for(var k in loop_data){
                loop.push([k, loop_data[k]]); }}

        for(var i=0; i<loop.length; ++i){
            var ref = loop[i][0];
            var val = loop[i][1];
            //console.log(ref_name, ref);
            var current_data = data;
            if(ref_name !== null){
                vars[ref_name] = ref; }
            if(val !== null){
                if(val_name !== null){
                    vars[val_name] = val; }
                else{
                    current_data = val; }}
            //console.log(vars);
            var processed_rest = ref_name? substitute(rest, vars) : rest;
            for(var j=0; j<processed_rest.length; ++j){
                result_parts.push(markupConverter(processed_rest[j], current_data)); }}
        return result_parts.join('');
    }
    */
    // if first param is array, it is list of assignments, otherwise, just do one assignnment.
    // variables must begin with '$'
    // variables can be referenced as '$a' or '${a}'
    // only assigned variables are substituted.  '$' not part of an assigned variable are ignored.
    function _let( list,data,markupConverter){
        var one = list[1];
        var assign_list;
        var substitutions = {};

        if(list.length < 3){
            logThrow("LispMarkup.macros.LET: At least 2 arguments are required"); }

        if(Array.isArray(one)){
            assign_list = one; }
        else{
            assign_list = [list[1],list[2]]; }

        if(assign_list.length % 2 != 0){
            logThrow("LispMarkup.macros.LET: assignment list must be even length."); }
        for(var i=0; i<assign_list.length; i+=2){
            var k = assign_list[i], v = assign_list[i+1];
            if(Array.isArray(v)){
                v = markupConverter(v, data); }
            if(typeof k == "function"){
                v = v(data); }
            if(typeof k != "string" || typeof v != "string"){
                logThrow("LispMarkup.macros.LET: variable name was not a string."); }
            if(typeof k != "string" || typeof v != "string"){
                logThrow("LispMarkup.macros.LET: variable value not a string or convertible to string"); }
            if(k.charAt(0) != '$'){
                logThrow("LispMarkup.macros.LET: variable must begin with '$'"); }
            if(substitutions.hasOwnProperty(k)){
                logThrow("LispMarkup.macros.LET: variable '" + k + "' assigned previously in this let statement."); }
            substitutions[k.substring(1)] = v;
        }
        
        // do substitutions
        var list = substitute(list.slice(Array.isArray(one)? 2 : 3), substitutions);
        var result_parts = [];
        for(var i=0; i<list.length; ++i){
            result_parts.push(markupConverter(list[i], data).toString()); }
        return result_parts.join(''); 
    }

    function substitute(x, vars){
        if(typeof vars != "object"){
            logThrow("LispMarkup.substitute: vars must be an object map"); }

        if(Array.isArray(x)){
            var result = [];
            for(var i=0; i<x.length; ++i){
                result[i] = substitute(x[i], vars); }
            return result; }
        if(typeof x == "object"){
            var result = {};
            for(var k in x){
                result[k] = substitute(x[k], vars); }
            return x; }
        if(typeof x == "string"){
            var result_parts = [];
            for(var i=0,k=0; i<x.length; ++i){
                var c = x[i];
                if(c=='\\') ++i;
                //  Variable substitution not performed in single quoted strings.
                if(c=='\''){
                    while(++i<x.length && x[i]!='\''){
                        if(x[i]=='\\') ++i; }}
                if(c=='$'){
                    var j = i+1;
                    var name = '';
                    ++i;
                    if(i<x.length && x[i] == '{'){
                        do ++i; 
                        while(i<x.length && x[i] != '}');
                        name = x.substring(j+1,i);
                        ++i; }
                    else{
                        while(i<x.length && x[i].match(/[_0-9A-Za-z]/)){
                            ++i; }
                        name = x.substring(j,i); }
                    if(name.length && vars.hasOwnProperty(name)){
                        //console.log("substituting ", name, vars[name]);
                        result_parts.push(x.substring(k,j-1), vars[name]);
                        k = i; }
                }
            }
            result_parts.push(x.substring(k));
            return result_parts.join('');
        }
        return x;
    }
    function concat( list,data,markupConverter){
        var result_parts = [''];
        for(var i=1; i<list.length; ++i){
            var s = markupConverter( list[i],data);
            result_parts.push(s.toString().trim()); }
        return result_parts.join('');
    }
    function concat_space( list,data,markupConverter){
        var result_parts = [''];
        for(var i=1; i<list.length; ++i){
            var s = markupConverter( list[i],data);
            result_parts.push(s.toString()); }
        return result_parts.join('');
    }

    function get( list,data,markupConverter){
        if(list.length == 1){
            return data.toString(); }
        else if(list.length == 2){
            
            return data[list[1]]? data[list[1]].toString() : ""; }
        else if(list.length == 3){
            var value = data[list[1]];
            if(value === null || value === undefined){
                // compute default value
                value = markupConverter(list[2],data,markupConverter); }
            return value.toString(); }
        else{
            logThrow("LispMarkup.macros.get invalid number of list arguments"); 
        }
    }
    function css( list,data,markupConverter){
        var result_parts = ['<style>'];
        for(var i=1; i<list.length; ++i){
            result_parts.push(handleEntry(list[i])); }
        result_parts.push('</style>');
        return result_parts.join('');
        
        function handleRule(rule){
            var result_parts = [];
            if(typeof rule == "function"){
                rule = rule(data); 
                if(typeof rule != "string"){
                     logThrow("LispMarkup.macros.css: tranform function for css rule did not return a string value."); }
                result_parts.push(rule); }
            else if(typeof rule == "string"){
                result_parts.push(rule); }
            else if(Array.isArray(rule)){
                var first = rule[0];
                if(typeof first == "function"){
                    return handleRule(first( rule,data,markupConverter)); }
                if(typeof first == "string"){
                    if(rule.length < 2){
                        logThrow("LispMarkup.macros.css: css rule must have at least 2 entries, a property and a value"); }
                    var property = first;
                    var value_parts = [];

                    for(var i=1; i<rule.length; ++i){
                        var value = rule[i];
                        if(Array.isArray(value)){
                            if(typeof value[0] != 'function'){
                                logThrow("LispMarkup.macros.css: if css rule value is a list, it must be a macro call."); }
                            var newvalue = value[0]( value,data,markupConverter);
                            value_parts.push(newvalue); }
                        else if(typeof value == "function"){
                            value_parts.push(value(data)); }
                        else if(typeof value == "string"){
                            value_parts.push(value); }
                        else{
                            logThrow("LispMarkup.macros.css: css rule value not a string, macro call, or view returning a string."); }}
                    result_parts.push(property + ": "  + value_parts.join(" ") + "; "); }
                else{
                    logThrow("LispMarkup.macros.css: css rule property not a string"); }}
            return result_parts.join("");
        }
        function handleEntry(entry){
            var result_parts = [];
            if(typeof entry == "string"){
                result_parts.push(entry); }
            else if(typeof entry == "function"){
                entry = entry(data);
                if(typeof entry != "string"){
                    logThrow("LispMarkup.macros.css: css entry view did not return a string"); }
                result_parts.push(entry); }
            else if(Array.isArray(entry)){
                var first = entry[0];
                if(typeof first == "function"){
                    return handleEntry(first( entry,data,markupConverter)); }
                if(typeof first == "string"){
                    var selector = first;
                    result_parts.push(selector + "{");
                    for(var i=1; i<entry.length; ++i){
                        var rule = entry[i];
                        result_parts.push(handleRule(rule)); }
                    result_parts.push("}"); }
                else{
                    logThrow("LispMarkup.macros.css: invalid selector type"); }}
            else{
                logThrow("LispMarkup.macros.css: invalid entry type"); }
            return result_parts.join("");
        }
    }
}


})()


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
 * markupConverter( l,data):
 *   l: the template, whether a lisp string or a javascript list datastructure, to be converted to markup.
 *     entries in l are handled accoring to the type of the entry:
 *       - lists within this list are evaluated recursively like in lisp.
 *       - objects are property sets which are added to current node in the markup.
 *       - a function in the first position of a list is a macro.
 *       - a function in a non-first position is a view function.
 *       - views in l are called with a data parameter which is the current context in the data.
 *          view( data);
 *          views must return a string.
 *       - macros in the template are called with the following parameters:
 *          macro( template,data,markupConverter);
 *            - l: the current list this macro is applied to,
 *                 which will include the macro itself in the first position.
 *            - data: for templating, this is the same parameter that is passed to markupConverter( l,data), see more below.
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
 *     Both tranformation and macro functions within l are passed this parameter as described above.
 */ 

(function(){  // scope

if(typeof module === 'undefined'){
    this['LispMarkup'] = defineExports(); }
else{
    module.exports = defineExports(); 
}



function defineExports(){
    var exports = {};
    // TODO use real typecheck module
    function T(){}

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
    exports.hasMacro = hasMacro;

    var macros = defineMacros();
    exports.macros = {};
    for(var k in macros){ // copy macros for external object, but don't expose original.
        exports.macros[k] = macros[k]; }

    // =========== Last Procedural Statement in Module ==============
    return exports;



    function addMacro(macro_name, macro_func){
        if(macros.hasOwnProperty(macro_name)){
            throw new Error("LispMarkup.addMacro: macro '" + macro_name + "' already exists."); }
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
            throw new Error("LispMarkup.compileTemplate: Template must be a lisp tree or an array."); }
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
        T(tagstr, "");
        T(props, {}, undefined);
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
                open_parts.push(" ", propname, "=\"", propvalue, "\""); }}
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
        for(var i=0,j=0; i<s.length; ++i){
            var c = s[i];
            if(c == "\\"){
                if(i==s.length-1){
                    throw new Error("lispTree: '\\' is last character"); }
                ++i; continue; }
            if(c == "\'"){
                var standalone = (i==j);
                while(s[++i] != "\'"){
                    if(i == s.length){
                        throw new Error("lispTree: unterminated string"); }
                    if(s[i] == "\\") ++i; }
                if(standalone && (i == s.length-1 || s[i+1].match(/[\s()]/))){
                    node.push(s.substring(j+1,i));
                    j = i+1; }}
            if(c == "\""){
                var standalone = (i==j);
                while(s[++i] != "\""){
                    if(i == s.length){
                        throw new Error("lispTree: unterminated string"); }
                    if(s[i] == "\\") ++i; }
                if(standalone && (i == s.length-1 || s[i+1].match(/[\s()]/))){
                    node.push(s.substring(j+1,i));
                    j = i+1; }}
            if(c == "("){ //log("("+i+","+j);
                if(i > j) node.push(s.substring(j,i));
                node.push(next = []);
                next.parent = node;
                node = next;
                j = i+1; }
            if(c == ")"){ //log(")"+i+","+j);
                if(i > j) node.push(s.substring(j,i));
                if(node == root){
                    throw new Error("lispTree: xtra ')'"); }
                node = node.parent;
                j = i+1; }
            if(c.match(/\s/)){ //log("_"+i+","+j);
                if(i > j) node.push(s.substring(j,i));
                while(i<s.length && s[i].match(/\s/)) ++i;
                j = i;
                --i;
            }
        }
        if(node != root){
            throw new Error("lispTree: xtra '('"); }
        if(i > j) root.push(s.substring(j,i));
        return root;
    }
    
    function customTagMarkupConverter(taghandler){
        if(typeof taghandler != "function"){
            throw new Error("LispMarkup markup conversion function: taghandler argument must be a function"); }
        
        // TODO make sure the right 'markupConverter' closure, with access to the proper taghandler is used for all recursive calls.
        // Some test cases would be nice.
        return markupConverter;  
        function markupConverter(l, data){
            T([], "", 0, l);
            T({}, [], undefined, data);
            var props = {};
            var first = l[0];
            var tagname = null;
            var result_parts = [''];  //save space for opening tag
            if(l === null || l === undefined){
                return ""; }
            if(typeof l == "string" || typeof l == "number"){
                return l.toString() + " "; }
            if(typeof first == "string"){
                if(macros.hasOwnProperty(first)){
                    first = macros[first]; }
                else{
                    tagname = first; }}
            if(typeof first == "function"){
                // first is a macro
                var macro = first;
                var macro_result = macro( l,data,markupConverter);
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
                    throw new Error("LispMarkup markup conversion function: macro returned value with invalid type."); }
                // returned
            }

            for(var i=0; i<l.length; ++i){
                if(i==0 && tagname) continue; //skip tag
                var x = l[i];
                if(Array.isArray(x)){
                    var result = markupConverter(x, data);
                    if(typeof result == "object" && result.constructor == ({}).constructor){
                        console.log("attributes ", result);
                        for(var k in result){
                            var property_value = result[k];
                            if(Array.isArray(property_value)){
                                props[k] = markupConverter(property_value, data); }
                            else if(typeof property_value == 'string' || typeof property_value == 'number'){
                                props[k] = property_value; }
                            else if(property_value === null || property_value === undefined){
                                props[k] = null; }
                            else{
                                throw new Error("LispMarkup: illegal property value type."); }}}
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
                        else{
                            throw new Error("LispMarkup: illegal property value type."); }}}
                else if(typeof x == "function"){
                    // view function
                    var view = x;
                    var view_result = view(data);
                    if(typeof view_result == "string"){
                        result_parts.push(view_result + " "); }
                    else if(!view_result){
                        result_parts.push(""); }
                    else{
                        throw new Error("LispMarkup markup conversion function: template returned value with invalid type."); }}
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
    macros.FOREACH = foreach;
    macros.FORINDEX = forindex;
    macros.FOR = foreach;
    macros.CONCAT = concat;
    macros.CONCAT_SPACE = concat_space;
    macros.GET = get;
    macros.CSS = css;
    macros.LET = _let;
    macros.FOR = _for;
    macros.STRINGIFY = _stringify;
    macros.PROPERTIES = properties;
    macros.PROPS = properties;
    macros["."] = get;
    macros[".."] = concat;
    macros["..."] = concat_space;
    macros["//"] = comment;
    macros[":"] = properties;
    macros["="] = _let;
    return macros;
    function properties( l,data,markupConverter){
        var props = {}
        for(var i=1; i<l.length-1; i+=2){
            props[l[i]] = l[i+1]; }
        return props;
    }
    
    function _stringify( l,data,markupConverter){
        if(l.length == 1){
            return JSON.stringify(data); }
        if(l.length == 2){
            return JSON.stringify(data[l[1]]); }
        throw new Error("LispMarkup.macros.STRINGIFY: only 0 or 1 arguments allowed.");

    }
    function _with( l,data,markupConverter){
        var result_parts = [];
        if(l.length < 3){
            throw new Error("LispMarkup.macros._with not enough list arguments"); }
        var context = l[1];
        if(data === null || data === "undefined"){
            throw new Error("LispMarkup.macros._with data is not defined"); }
        if(typeof context == "function"){
            data = context(data); }
        else if(typeof context == "string" || typeof context == "number"){
            data = data[context]; }
        else{
            throw new Error("LispMarkup.macros._with invalid type for context argument"); }
        for(var i=2; i<l.length; ++i){
            result_parts.push(markupConverter( l[i],data,markupConverter)); }
        return result_parts.join("");
    }
    function comment( l,data,markupConverter){
        return "";
    }
    function forindex( l,data,markupConverter){
        var result_parts = [];
        var datalist = [];
        var _l;
        if(l.length == 2){
            datalist = data;
            _l = l[1]; }
        else if(l.length == 3){
            var listgetter = l[1];
            _l = l[2];
            if(typeof listgetter == "function"){
                datalist = listgetter(data); }
            else if(typeof listgetter == "string"){
                datalist = data[listgetter]; }}
        else{
            throw new Error("LispMarkup.macros.foreach invalid number list of arguments"); }
        
        for(var i=0; i<datalist.length; ++i){
            var item = datalist[i];
            var data_obj = {
                INDEX: i+1,
                VALUE: item,
                I: i+1,
                VAL: item,
                X: item
            }
            result_parts.push(markupConverter( _l,data_obj)); }
        return result_parts.join('');
 
    }
    // if l[1] is array, it is a a list of FOR parameters,
    // otherwise, l[1] is the the only FOR parameter.
    // if the first parameter is not '$' prefixed, it is a selector,
    // the first $ prefixed parameter is the index or key.
    // the second $ prefixed parameter is the value.
    // if there is only 1 $ prefixed parameter, the value is used as the data context.
    function _for( l,data,markupConverter){
        var one = l[1];
        var params;
        var substitutions;

        if(l.length < 2){
            throw new Error("LispMarkup.macros.FOR: at least 1 argument required."); }

        if(Array.isArray(one)){
            params = one; }
        else{
            params = [one]; }
        if(params.length < 1){
            throw new Error("LispMarkup.macros.FOR: param list is empty."); }
        if(params.length > 3){
            throw new Error("LispMarkup.macros.FOR: param list exceeds the 3 maximum allowed entries."); }

        var index = 0;
        var loop_data = data;
        // if first param is not $ prefixed, it selects the loop_data.
        if(typeof params[index] != "string" || params[index][0] != "$"){
            var context = params[index];
            ++index;
            if(loop_data === null || loop_data === undefined){
                throw new Error("LispMarkup.macros.FOR: data is not defined"); }
            if(typeof context == "function"){
                loop_data = context(loop_data); }
            else if(typeof context == "string" || typeof context == "number"){
                loop_data = loop_data[context]; }
            else{
                throw new Error("LispMarkup.macros.FOR: invalid type for context argument"); }
        }
        if(!Array.isArray(loop_data) && typeof loop_data != "object"){
            throw new Error("LispMarkup.macros.FOR: loop_data context can't be iterated over, not array or object"); }

        var ref_name = null, val_name = null;
        if(index < params.length){
            var p = params[index]; // index or key
            ++index;
            if(typeof p != "string" || p[0] != "$"){
                throw new Error("LispMarkup.macros.FOR: expected '$' prefixed variable name for loop index or key"); }
            ref_name = p.substr(1);
        }
        if(index < params.length){
            var p = params[index];
            ++index;
            if(typeof p != "string" || p[0] != "$"){
                throw new Error("LispMarkup.macros.FOR: expected '$' prefixed variable name for loop index or key"); }
            val_name = p.substr(1);
        }
    
        var rest = l.slice(2);
        var result_parts = [];
        var vars = {};
        var loop = [];
        if(ref_name !== null){
            vars[ref_name] = "";
            if(val_name !== null){
                vars[val_name] = ""; }}
        else if(val_name !== null){
            throw new Error("LispMarkup.macros.FOR: loop value variable unexpectedly assigned when loop reference variable was not."); }

        if(Array.isArray(loop_data)){
            for(var i=0; i<loop_data.length; ++i){
                loop.push([i+1, loop_data[i]]); }}
        else if(typeof loop_data == "object"){
            for(var k in loop_data){
                loop.push([k, loop_data[k]]); }}

        for(var i=0; i<loop.length; ++i){
            var ref = loop[i][0];
            var val = loop[i][1];
            var current_data = data;
            if(ref_name !== null){
                vars[ref_name] = ref; }
            if(val_name !== null){
                vars[val_name] = val; }
            else{
                current_data = val; }
            //console.log(vars);
            var processed_rest = ref_name? substitute(rest, vars) : rest;
            for(var j=0; j<processed_rest.length; ++j){
                result_parts.push(markupConverter(processed_rest[j], current_data)); }}
        return result_parts.join('');
    }
    // if first param is array, it is list of assignments, otherwise, just do one assignnment.
    // variables must begin with '$'
    // variables can be referenced as '$a' or '${a}'
    // only assigned variables are substituted.  '$' not part of an assigned variable are ignored.
    function _let( l,data,markupConverter){
        var one = l[1];
        var assign_list;
        var substitutions = {};

        if(l.length < 3){
            throw new Error("LispMarkup.macros.LET: At least 2 arguments are required"); }

        if(Array.isArray(one)){
            assign_list = one; }
        else{
            assign_list = [l[1],l[2]]; }

        if(assign_list.length % 2 != 0){
            throw new Error("LispMarkup.macros.LET: assignment list must be even length."); }
        for(var i=0; i<assign_list.length; i+=2){
            var k = assign_list[i], v = assign_list[i+1];
            if(Array.isArray(v)){
                v = markupConverter(v, data); }
            if(typeof k == "function"){
                v = v(data); }
            if(typeof k != "string" || typeof v != "string"){
                throw new Error("LispMarkup.macros.LET: variable name was not a string."); }
            if(typeof k != "string" || typeof v != "string"){
                throw new Error("LispMarkup.macros.LET: variable value not a string or convertible to string"); }
            if(k.charAt(0) != '$'){
                throw new Error("LispMarkup.macros.LET: variable must begin with '$'"); }
            if(substitutions.hasOwnProperty(k)){
                throw new Error("LispMarkup.macros.LET: variable '" + k + "' assigned previously in this let statement."); }
            substitutions[k.substr(1)] = v;
        }
        
        // do substitutions
        var l = substitute(l.slice(Array.isArray(one)? 2 : 3), substitutions);
        var result_parts = [];
        for(var i=0; i<l.length; ++i){
            result_parts.push(markupConverter(l[i], data).toString()); }
        return result_parts.join(''); 
    }

    function substitute(x, vars){
        if(typeof vars != "object"){
            throw new Error("LispMarkup.substitute: vars must be an object map"); }

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
                        name = x.substr(j+1,i-1); }
                    else{
                        while(i<x.length && x[i].match(/[_0-9A-Za-z]/)){
                            ++i; }
                        name = x.substr(j,i); }
                    if(name.length && vars.hasOwnProperty(name)){
                        //console.log("substituting ", name, vars[name]);
                        result_parts.push(x.substr(k,j-1), vars[name]);
                        k = i; }
                }
            }
            result_parts.push(x.substr(k));
            return result_parts.join('');
        }
        return x;
    }
    function foreach( l,data,markupConverter){
        var result_parts = [];
        var datalist = [];
        var _l;
        if(l.length == 2){
            datalist = data;
            _l = l[1]; }
        else if(l.length == 3){
            var listgetter = l[1];
            _l = l[2];
            if(typeof listgetter == "function"){
                datalist = listgetter(data); }
            else if(typeof listgetter == "string"){
                datalist = data[listgetter]; }}
        else{
            throw new Error("LispMarkup.macros.FORINDEX: invalid number list of arguments"); }
        
        for(var i=0; i<datalist.length; ++i){
            var item = datalist[i];
            result_parts.push(markupConverter( _l,item)); }
        return result_parts.join('');
    }
    function concat( l,data,markupConverter){
        var result_parts = [''];
        for(var i=1; i<l.length; ++i){
            var s = markupConverter( l[i],data);
            result_parts.push(s.toString().trim()); }
        return result_parts.join('');
    }
    function concat_space( l,data,markupConverter){
        var result_parts = [''];
        for(var i=1; i<l.length; ++i){
            var s = markupConverter( l[i],data);
            result_parts.push(s.toString()); }
        return result_parts.join('');
    }

    function get( l,data,markupConverter){
        if(l.length == 1){
            return data.toString(); }
        else if(l.length == 2){
            return data[l[1]].toString(); }
        else if(l.length == 3){
            var value = data[l[1]];
            if(value === null || value === undefined){
                // compute default value
                value = markupConverter(l[2],data,markupConverter); }
            return value.toString(); }
        else{
            throw new Error("LispMarkup.macros.get invalid number of list arguments"); 
        }
    }
    function css( l,data,markupConverter){
        var result_parts = ['<style>'];
        for(var i=1; i<l.length; ++i){
            result_parts.push(handleEntry(l[i])); }
        result_parts.push('</style>');
        return result_parts.join('');
        
        function handleRule(rule){
            var result_parts = [];
            if(typeof rule == "function"){
                rule = rule(data); 
                if(typeof rule != "string"){
                     throw new Error("LispMarkup.macros.css: tranform function for css rule did not return a string value."); }
                result_parts.push(rule); }
            else if(typeof rule == "string"){
                result_parts.push(rule); }
            else if(Array.isArray(rule)){
                var first = rule[0];
                if(typeof first == "function"){
                    return handleRule(first( rule,data,markupConverter)); }
                if(typeof first == "string"){
                    if(rule.length < 2){
                        throw new Error("LispMarkup.macros.css: css rule must have at least 2 entries, a property and a value"); }
                    var property = first;
                    var value_parts = [];

                    for(var i=1; i<rule.length; ++i){
                        var value = rule[i];
                        if(Array.isArray(value)){
                            if(typeof value[0] != 'function'){
                                throw new Error("LispMarkup.macros.css: if css rule value is a list, it must be a macro call."); }
                            var newvalue = value[0]( value,data,markupConverter);
                            value_parts.push(newvalue); }
                        else if(typeof value == "function"){
                            value_parts.push(value(data)); }
                        else if(typeof value == "string"){
                            value_parts.push(value); }
                        else{
                            throw new Error("LispMarkup.macros.css: css rule value not a string, macro call, or view returning a string."); }}
                    result_parts.push(property + ": "  + value_parts.join(" ") + "; "); }
                else{
                    throw new Error("LispMarkup.macros.css: css rule property not a string"); }}
            return result_parts.join("");
        }
        function handleEntry(entry){
            var result_parts = [];
            if(typeof entry == "string"){
                result_parts.push(entry); }
            else if(typeof entry == "function"){
                entry = entry(data);
                if(typeof entry != "string"){
                    throw new Error("LispMarkup.macros.css: css entry view did not return a string"); }
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
                    throw new Error("LispMarkup.macros.css: invalid selector type"); }}
            else{
                throw new Error("LispMarkup.macros.css: invalid entry type"); }
            return result_parts.join("");
        }
    }
}


})()

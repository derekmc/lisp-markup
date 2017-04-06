
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
 *            - data: for templating, this is the same parameter that is passed to markupCoverter( l,data), see more below.
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


(function(exports){
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

    var macros = require("./macros.js");
    exports.macros = {};
    for(var k in macros){ // copy macros for external object, but don't expose original.
        exports.macros[k] = macros[k]; }

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
            throw new Error("LispMarkup.compileTemplate: Template must be a lisp tree."); }
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
            open_parts.push(" ", proplist[i], "=\"", proplist[i+1],"\""); }
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
                    throw new Error("parenTree: '\\' is last character"); }
                ++i; continue; }
            if(c == "\'"){
                var standalone = (i==j);
                while(s[++i] != "\'"){
                    if(i == s.length){
                        throw new Error("parenTree: unterminated string"); }
                    if(s[i] == "\\") ++i; }
                if(standalone && (i == s.length-1 || s[i+1].match(/[\s()]/))){
                    node.push(s.substring(j+1,i));
                    j = i+1; }}
            if(c == "\""){
                var standalone = (i==j);
                while(s[++i] != "\""){
                    if(i == s.length){
                        throw new Error("parenTree: unterminated string"); }
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
                    throw new Error("parenTree: xtra ')'"); }
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
            throw new Error("parenTree: xtra '('"); }
        if(i > j) root.push(s.substring(j,i));
        return root;
    }
    
    function customTagMarkupConverter(taghandler){
        if(typeof taghandler != "function"){
            throw "LispMarkup markup conversion function: taghandler argument must be a function"; }
        
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
                    for(var k in macro_result){
                        var property_value = macro_result[k];
                        if(Array.isArray(property_value)){
                            props[k] = markupConverter(property_value, data); }
                        else if(typeof property_value == 'string' || typeof property_value == 'number'){
                            props[k] = property_value; }
                        else{
                            throw new Error("LispMarkup: illegal property value type."); }}
                }
                else if(!macro_result){
                    return ""; }
                else{
                    throw "LispMarkup markup conversion function: macro returned value with invalid type."; }
                // returned
            }

            for(var i=0; i<l.length; ++i){
                if(i==0 && tagname) continue; //skip tag
                var x = l[i];
                if(Array.isArray(x)){
                    result_parts.push(markupConverter(x, data)); }
                else if(typeof x == "object"){
                    for(var k in macro_result){
                        var property_value = macro_result[k];
                        if(Array.isArray(property_value)){
                            props[k] = markupConverter(property_value, data); }
                        else if(typeof property_value == 'string' || typeof property_value == 'number'){
                            props[k] = property_value; }
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
                        throw "LispMarkup markup conversion function: template returned value with invalid type."; }}
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
})(typeof exports === 'undefined'? this['LispMarkup']={}: exports);
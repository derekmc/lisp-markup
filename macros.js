
// Macros
(function(exports){
    exports.WITH = _with;
    exports.COMMENT = comment;
    exports.FOREACH = foreach;
    exports.CONCAT = concat;
    exports.GET = get;
    exports.CSS = css;
    exports.STRINGIFY = function( l,data,markupConverter){
        if(l.length == 1){
            return JSON.stringify(data); }
        if(l.length == 2){
            return JSON.stringify(data[l[1]]); }
        throw "Lisp2Markup.macros.STRINGIFY: only 0 or 1 arguments allowed.";

    }
    function _with( l,data,markupConverter){
        var result_parts = [];
        if(l.length < 3){
            throw "Lisp2Markup.macros._with not enough list arguments"; }
        var context = l[1];
        if(!data){
            throw "Lisp2Markup.macros._with data is not defined"; }
        if(typeof context == "function"){
            data = context(data); }
        else if(typeof context == "string" || typeof context == "number"){
            data = data[context]; }
        else{
            throw "Lisp2Markup.macros._with invalid type for context argument;" }
        for(var i=2; i<l.length; ++i){
            result_parts.push(markupConverter( l[i],data,markupConverter)); }
        return result_parts.join("");
    }
    function comment( l,data,markupConverter){
        return "";
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
            throw "Lisp2Markup.macros.foreach invalid number list of arguments"; }
        
        for(var i=0; i<datalist.length; ++i){
            var item = datalist[i];
            result_parts.push(markupConverter( _l,item)); }
        return result_parts.join('');
    }
    function concat( l,data,markupConverter){
        var result_parts = [''];
        for(var i=1; i<l.length; ++i){
            result_parts.push(markupConverter( l[i],data)); }
        return result_parts.join('');
    }
    function get( l,data,markupConverter){
        if(l.length == 1){
            return data; }
        else if(l.length == 2){
            return data[l[1]]; }
        else if(l.length == 3){
            var value = data[l[1]];
            if(value === null || value === undefined){
                // compute default value
                value = markupConverter(l[2],data,markupConverter); }
            return value; }
        else{
            throw "Lisp2Markup.macros.get invalid number of list arguments"; 
        }
    }
    function css( l,data,markupConverter){
        var result_parts = ['<style>'];
        for(var i=1; i<l.length; ++i){
            handleEntry(l[i]); }
        result_parts.push('</style>');
        return result_parts.join('');
        
        function handleRule(rule){
            if(typeof rule == "function"){
                rule = rule(data); 
                if(typeof rule != "string"){
                     throw "Lisp2Markup.macros.css: tranform function for css rule did not return a string value."; }
                result_parts.push(rule); }
            else if(typeof rule == "string"){
                result_parts.push(rule); }
            else if(Array.isArray(rule)){
                var first = rule[0];
                if(typeof first == "function"){
                    return handleRule(first( rule,data,markupConverter)); }
                if(typeof first == "string"){
                    if(rule.length != 2){
                        throw "Lisp2Markup.macros.css: css rule must have 2 entries, property and value"; }
                    var property = first;
                    var value = rule[1];
                    if(Array.isArray(value)){
                        if(typeof value[0] != 'function'){
                            throw "Lisp2Markup.macros.css: if css rule value is list, it must be a macro call."; }
                        var newvalue = value[0]( value,data,markupConverter);
                        var newrule = [property, newvalue];
                        return handleRule(newrule); }
                    if(typeof value == "function"){
                        value = value(data); }
                    if(typeof value != "string"){
                        throw "Lisp2Markup.macros.css: css rule value not a string, macro call, or view returning a string."; }
                    result_parts.push(property + ": "  + value + "; "); }
                else{
                    throw "Lisp2Markup.macros.css: css rule property not a string"; }}
        }
        function handleEntry(entry){
            if(typeof entry == "string"){
                result_parts.push(entry); }
            else if(typeof entry == "function"){
                entry = entry(data);
                if(typeof entry != "string"){
                    throw "Lisp2Markup.macros.css: css entry view did not return a string" }
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
                        handleRule(rule); }
                    result_parts.push("}"); }
                else{
                    throw "Lisp2Markup.macros.css: invalid selector type"; }}
            else{
                throw "Lisp2Markup.macros.css: invalid entry type"; }
        }
    }

})(typeof exports === 'undefined'? this['Lisp2Markup']={}: exports);

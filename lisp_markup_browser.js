

(function(){

    var script_sources = {};
    var templates = {};

    var CONTAINER_SUFFIX = "-container";
    var DATA_SUFFIX = "_data";
    var CONTENT_SUFFIX = /-content$|-template$/

    var SCRIPT_TYPE = "text/lisp-markup"; 


    function getContainers(id){
        var list = [];
        var key = _id + CONTAINER_SUFFIX;
        list.append(document.getElementsByClassName(key));
        var elem = document.getElementById(key);
        if(elem) list.append(elem);
        return list;
    }

    // TODO check for containers that are both top level and lower level
    // Don't allow that container hierarchy.
    function updateAll(){
        
        // clear all containers
        for(var id in scripts){
            var list = getContainers(id);
            for(var i=0; i<list.length; ++i){
                var elem = list[i];
                if(elem){
                    elem.innerHTML = ""; }}
        }

        // find all toplevel containers
        var toplevel = [];

        for(var id in scripts){
            var list = getContainers(id);
            if(list.length > 0){
                toplevel.push(id); }
        }

        // update all toplevel containers
        for(var i=0; i<toplevel.length; ++i){
            updateContainer(toplevel[i]); }
    }


    function updateContainer(id, dataset){
        var list = getContainers(id);
        if(list.length == 0){
            console.warn("LispMarkup: updateContainer() for id '" + id + "', no matching container."); }

        // clear
        for(var i=0; i<list.length; ++i){
            list[i].innerHTML = ""; }

        // all ids that don't have a matching container anywhere in page after clearing specified element.
        var missing = {};  

        for(var _id in scripts){
            var list = getContainers(_id);
            if(list.length == 0){
                missing[_id] = null; }
        }

        // do update
        // TODO static html update
        var script = scripts[id];
        var containers = getContainers(id);
        var result = ""

        if(script.type == SCRIPT_TYPE){
            result = HTMLParen.tohtml(script.value);
        }
        else if(script.type == "text/html"){
            result = script.value;
        }
        else if(script.type == "text/plain"){
            result = script.value;
        }
        for(var i=0; i<containers.length; ++i){
            if(script.type == "text/plain"){
                containers[i].appendChild(document.createTextNode(result)); }
            else{
                containers[i].innerHTML = result; }
        }
        // TODO template update

        // find which missing containers were inserted by update
        var added = {}
        for(var _id in missing){
            var list = getContainers(_id);
            if(list.length > 0){
                added[_id] = null; }
        }
        
        // update replaced containers
        for(var _id in added){
            update(_id); }


    }

    function getScripts(){
        var elems = document.getElementsByTagName("script");
        for(var i=0; i<elems.length; ++i){
            var elem = elems[i];
            var scriptid = elem.id;
            var type = elem.type;
            var value = elem.innerHTML;
            if(scriptid){ // remove suffix from id.
                scriptid = scriptid.replace(CONTENT_SUFFIX, ""); }
            if(type == SCRIPT_TYPE){
                scripts[scriptid] = value; }
        }
    }

    function init(){
        console.log("init lisp_markup.js in browser.");
        if(!LispMarkup){
             throw "LispMarkup library not available."; }
        getScripts();
        updateAll();
    }
})

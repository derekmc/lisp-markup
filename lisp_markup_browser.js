
var LispMarkupBrowser = {};

(function(){

    var templates = {};

    var CONTAINER_SUFFIX = "";
    var DATA_SUFFIX = "_data";
    var CONTENT_SUFFIX = /-content$|-template$/

    var SCRIPT_TYPE = "text/lisp-markup"; 
    
    LispMarkupBrowser.setContentTemplate = setContentTemplate;
    LispMarkupBrowser.getContentTemplate = getContentTemplate;

    LispMarkupBrowser.updateAll = updateAll;
    LispMarkupBrowser.updateContainers = updateContainers;
    LispMarkupBrowser.getContainers = getContainers;
    LispMarkup.addMacro("SECTION", macroDefineTemplate);

    // -------- Last Procedural Statement in Module -----------
    window.addEventListener("load", browserInit);
    return;

    // null or undefined deletes the template definition
    function setContentTemplate(template_name, template){
        if(template === null || template === "undefined"){
            delete templates[template_name];
            return; }
        if(typeof template == "string"){
            template = LispMarkup.compileTemplate(template); }
        if(typeof template != "function"){
            throw new Error("LispMarkupBrowser.setContentTemplate: Template must be a string in LispMarkup format or a function."); }
        templates[template_name] = template;
    }

    function getContentTemplate(template_name){
        return templates[template_name];
    }

    // macro for defining a template
    // (SECTION template_name template_contents...)
    // online processes the rest of the template definition if LispMarkupBrowser
    // does not already have template with name 'template_name'.
    function macroDefineTemplate( l,data,markupConverter){
        //console.log("SECTION", l);
        if(l.length < 2){
            throw new Error("LispMarkupBrowser.macroDefineTemplate: at least 2 list entries required in template definition."); }
        var template_name = l[1];
        if(templates.hasOwnProperty(template_name)){
            console.warn("LispMarkupBrowser.macroDefineTemplate: template '" + template_name + "' already defined."); }
        var rest_of_list = l.slice(2);
        var template = LispMarkup.compileTemplate(rest_of_list);
        templates[template_name] = function(data){
            //console.log("SECTION template", data);
            return template(data);
        }
        //console.log(templates);
    }

    function getContainers(container_name){
        var list = [];
        var key = container_name + CONTAINER_SUFFIX;
        var elems = document.getElementsByClassName(key);
        for(var i=0; i<elems.length; ++i){
            list.push(elems[i]); }
        var elem = document.getElementById(key);
        if(elem) list.push(elem);
        return list;
    }

    // Performs recursive container updates.
    // Doesn't allow containers with the same name at different recursive render depths,
    // If a container has the same name as a container that was rendered in a previous recursive render depth, it won't get filled.
    function updateAll(datasets){
        if(datasets === null || datasets == undefined) datasets = {};
        if(typeof datasets != "object"){
            throw new Error("LispMarkupBrowser.updateAll(): datasets parameter, if specified, must be an object."); }
        
        // clear all containers
        for(var name in templates){
            var list = getContainers(name);
            for(var i=0; i<list.length; ++i){
                list[i].innerHTML = ""; }}

        
        // Update all containers.
        // Containers with the same name should not be created at different depths of recursive rendering, including the top level. 
        // There is no easy way to distinguish newly rendered containers from existing ones,
        // so this ensures all containers with the same name get rendered exactly once.
        // It also avoids infinitely recursing container structure.
        // If you create a container with the same name as one existing in a previous recursive render depth, it will not be filled.

        var container_queue = [];  //empty queue signals to check for new containers, starting a new recursive render depth.
        var queued_container_set = {};
        while(true){
            if(container_queue.length == 0){  // empty queue, check for new containers after each render depth is completed.
                var new_containers = false;
                for(var _container_name in templates){
                    var container_list = getContainers(_container_name);
                    if(container_list.length > 0){
                        if(!queued_container_set.hasOwnProperty(_container_name)){
                            new_containers = true;
                            //console.log("Queueing container for rendering: " + _container_name);
                            container_queue.push(_container_name); 
                            queued_container_set[_container_name] = true; }}}
                if(!new_containers){
                    break; }
                continue;
            }
            var container_name = container_queue.shift();
            updateContainers(container_name, datasets[container_name]);
        }
    }

    function updateContainers(container_name, data){
        var container_list = getContainers(container_name);
        if(container_list.length == 0){
            console.warn("LispMarkupBrowser updateContainer(): no container with name '" + container_name + "'."); }

        if(data === undefined){
            var data_var_name = container_name + DATA_SUFFIX;
            //console.log("data_var_name: " + data_var_name);
            if(data_var_name in window){
                data = window[data_var_name]; }}

        // render
        for(var i=0; i<container_list.length; ++i){
            var template = templates[container_name];
            container_list[i].innerHTML = template(data);
        }
    }

    function getScripts(){
        var scripts = {}
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
        return scripts;
    }

    function browserInit(){
        console.log("init lisp_markup.js in browser.");
        if(!LispMarkup){
             throw "LispMarkup library not available."; }
        var scripts = getScripts();
        for(var name in scripts){
            console.log("LispMarkupBrowser: Compiling template: " + name);
            templates[name] = LispMarkup.compileTemplate(scripts[name]); }
        updateAll();
    }
})();

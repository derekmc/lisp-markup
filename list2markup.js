

(function(exports){
  // TODO use real typecheck module
  function T(){}

  /* defaultTagHandler: process html tags
   * parses tagname and optionally id and classes
   * id starts with a hash "#"
   * classes start with a period "."
   *
   * returns [opentag, closetag]
   */
  exports.defaultTagHandler = function(tagstr, props){
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
  /*
   *   taghandlers: [[name, match, handler]]
   *     'match' is used to determine if a given handler should process a set of tags
   *     iff match(tagstr) returns true, then handler(tagstr, props) is called
   *     'handler' should return [opentag, closetag]
   */

  /* list2markup: turn a lisp-style list datastructure into html 
   * parameters:
   *   l:
   *     the list datastructure to be converted.
   *     - an object is a set of properties
   *     - a function in the first position of a list is a macro.
   *     - a function in a non-first position is a template function.
   *   data:
   *     data parameter to macro or template functions.
   */ 
  exports.list2markup = function(l, data){
      T(l, []);
      T(data, {}, [], undefined);
      var props = {},
          first = l[0],
          parts = [''];  //save space for opening tag
      if(typeof first == "function"){
          // first is a macro
          var macro = first;
          var macro_result = macro(l, data, exports.list2markup);
          if(typeof macro_result == "string"){
              return macro_result; }
          else if(Array.isArray(macro_result)){
              return exports.list2markup(macro_result, data); }
          else if(!macro_result){
              return ""; }
          else{
              throw "list2markup: macro returned value with invalid type."; }
          // returned
      }

      var tagname = null;
      if(typeof first == "string"){
          tagname = first; }

      for(var i=0; i<l.length; ++i){
          if(i==0 && tagname) continue; //skip tag
          var x = l[i];
          if(Array.isArray(x)){
              parts.push(exports.list2markup(x, data)); }
          else if(typeof x == "object"){
              for(var k in x){
                  props[k] = x[k]; }}
          else if(typeof x == "function"){
              // template function
              var template = x;
              var template_result = template(data);
              if(typeof template_result == "string"){
                  parts.push(template_result); }
              else if(!template_result){
                  parts.push(""); }
              else{
                  throw "list2markup: template returned value with invalid type."; }}
          else{
               if(x) parts.push(x.toString()); }
      }
      if(tagname){
          // TODO custom tag handlers
          var handler = exports.defaultTagHandler;
          var tags = handler(tagname, props);
          parts[0] = tags[0];
          parts.push(tags[1]); }
      return parts.join('');
  }
  

})(typeof exports === 'undefined'? this['List2Markup']={}: exports);



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

  /* list2html: turn a lisp-style list datastructure into html 
   * parameters;
   *   t:
   *     the list datastructure to be converted.
   *   macros: [[name, macro]]
   *     if 'name' matches the exact string of the first item in a list,
   *     the function 'macro' is applied to transform the rest of the list.
   *   taghandlers: [[name, match, handler]]
   *     'match' is used to determine if a given handler should process a set of tags
   *     iff match(tagstr) returns true, then handler(tagstr, props) is called
   *     'handler' should return [opentag, closetag]
   */ 
  exports.list2html = function(l, macros, taghandlers){
      T(l, []);
      T(macros, undefined, [['', function(){}]]) // [[name, macro]]
      T(taghandlers, undefined, [['', function(){},function(){}]]) //[[name, match, handler]]
      var props = {},
          tagname = l[0],
          parts = [''];  //save space for opening tag
      if(typeof tagname != "string"){
          tagname = null; }
      // TODO macros
      for(var i=0; i<l.length; ++i){
          if(i==0 && tagname) continue; //skip tag
          var x = l[i];
          if(Array.isArray(x)){
              parts.push(exports.list2html(x, macros, taghandlers)); }
          else if(typeof x == "object"){
              for(var k in x){
                  props[k] = x[k]; }}
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
  

})(typeof exports === 'undefined'? this['List2Html']={}: exports);

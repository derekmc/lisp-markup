
/*
 * List2Markup: turn a lisp-style list datastructure into markup such as html. 
 * 
 * Lisp2Markup has built in conversion functions and you may create your own conversion
 * functions by providing a taghandler.
 *
 * Built-In Conversions:
 *    toHtml: convert to html.
 *
 * To make a custom markup conversion function, use the following function.
 *
 * customMarkupConverter(taghandler):
 *   creates a custom markup conversion function using the provided taghandler function.
 *
 * All markup conversion functions follow the following calling pattern.
 *
 * markupConverter( l,data):
 *   l: the lisp-like list datastructure to be converted to markup.
 *     entries in l are handled accoring to the type of the entry:
 *       - lists within this list are evaluated recursively like in lisp.
 *       - objects are property sets which are added to current node in the markup.
 *       - a function in the first position of a list is a macro.
 *       - a function in a non-first position is a template function.
 *       - templates in l are called with the data parameter.
 *          template( data);
 *          templates must return a string.
 *       - macros in l are called with the following parameters:
 *          macro( l,data,markupConverter);
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
 *     Both template and macro functions within l are passed this parameter as described above.
 */ 


(function(exports){
  // TODO use real typecheck module
  function T(){}

  /* htmlTagHandler: process html tags
   * parses tagname and optionally id and classes
   * id starts with a hash "#"
   * classes start with a period "."
   *
   * returns [opentag, closetag]
   */
  exports.htmlTagHandler = htmlTagHandler;
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
  
  exports.customMarkupConverter = customMarkupConverter;
  exports.toHtml = customMarkupConverter(htmlTagHandler);

  function customMarkupConverter(taghandler){
      if(typeof taghandler != "function"){
          throw "List2Markup markup conversion function: taghandler argument must be a function"; }
      
      return markupConverter;
      function markupConverter(l, data){
          T(l, []);
          T(data, {}, [], undefined);
          var props = {},
              first = l[0],
              result_parts = [''];  //save space for opening tag
          if(typeof first == "function"){
              // first is a macro
              var macro = first;
              var macro_result = macro(l, data, markupConverter);
              if(typeof macro_result == "string"){
                  return macro_result; }
              else if(Array.isArray(macro_result)){
                  return markupConverter(macro_result, data); }
              else if(typeof macro_result == "object" && macro_result.constructor == ({}).constructor){
                  throw "List2Markup markup conversion function: TODO implement allowing returning properties from macros.";
              }
              else if(!macro_result){
                  return ""; }
              else{
                  throw "List2Markup markup conversion function: macro returned value with invalid type."; }
              // returned
          }

          var tagname = null;
          if(typeof first == "string"){
              tagname = first; }

          for(var i=0; i<l.length; ++i){
              if(i==0 && tagname) continue; //skip tag
              var x = l[i];
              if(Array.isArray(x)){
                  result_parts.push(markupConverter(x, data)); }
              else if(typeof x == "object"){
                  for(var k in x){
                      props[k] = x[k]; }}
              else if(typeof x == "function"){
                  // template function
                  var template = x;
                  var template_result = template(data);
                  if(typeof template_result == "string"){
                      result_parts.push(template_result); }
                  else if(!template_result){
                      result_parts.push(""); }
                  else{
                      throw "List2Markup markup conversion function: template returned value with invalid type."; }}
              else{
                   if(x) result_parts.push(x.toString()); }
          }
          if(tagname){
              var tags = taghandler(tagname, props);
              result_parts[0] = tags[0];
              result_parts.push(tags[1]); }
          return result_parts.join('');
      }
  }
})(typeof exports === 'undefined'? this['List2Markup']={}: exports);

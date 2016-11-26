

# Lisp2Markup
#### Lisp-like markup templates in javascript.

## Overview

Lisp2Markup is a lisp-like templating tool for javascript that outputs markup such as html.

The two most notable features of List2Markup are its use of the lisp mentality of code as data,
and a macro system that takes advantage of this to facilitate powerful and intuitive template macros written in javascript.
 * __Lisp Mentality:__ Code as data.
   * Lisp2Markup allows you to use a javascript string in lisp syntax as your template, or build your template programmatically using javascript lists.
   * When javascript lists are used, templates may be written as JSON datastructures.  Templates written this way still closely resemble lisp code.
 * __Lisp-Like Macros:__
   * Lisp, in my opinion, has the best macro system of any programming language.
     The fact that all code is a data facilitates this.
   * Lisp2Markup takes advantage of this approach to macros, but without including the lisp programming language, only it's syntax and "code as data" approach.
   * Macros are written in javascript and have access to the portion of the template they are applied on as a javascript datastructure.
   * Macros also have access to the data being used by the template for the conversion, and the original markup conversion function.
     

You can use the provided macro functions or write your own.

## Built-In and Custom Markup Conversions

Lisp2Markup has built in markup conversion function for html and you may create your own conversion
functions for other markup languages by providing a taghandler.

### Built-In Markup Conversions Available

 * <code>toHtml</code>: convert to html.

### Custom Markup Conversion

To make a custom markup conversion function, you must write a tag handler.
The tag handler accepts the tagname and a set of properties,
and returns a tuple containing the opening and closing tag strings.

    function taghandler( tagname,properties){
        var open_tag_str = /* do stuff */;
        var close_tag_str = /* do stuff*/;

        return [open_tag_str, close_tag_str];
    }
    
You can then generate your markup conversion from the taghandler: 

    var converter = customMarkupConverter(taghandler);


All markup conversion functions follow the following calling pattern.

    markupConverter( l,data):


  * l: the template, whether a string in lisp syntax(TODO) or a javascript datastructure, to be converted to markup.
    * entries in l are handled accoring to the type of the entry:
      - lists within this list are evaluated recursively like in lisp.
      - objects are property sets which are added to current node in the markup. TODO allow using templates and macros to fill object properties.
      - a function in the first position of a list is a macro.
      - a function in a non-first position is a view function.
      - views in l are called with a data parameter which is the current context in the data.
         * view( data);
         * views must return a string.
      - macros in the template are called with the following parameters:
         * macro( template,data,markupConverter);
           - l: the current list this macro is applied to,
                which will include the macro itself in the first position.
           - data: for templating, this is the same parameter that is passed to markupCoverter( l,data), see more below.
           - markupConverter: macros are provided the current markupConverter function so they can do more magic.
           * The macro's return value is used in place of the original list with the macro.
           * If it returns a string, that string is inserted into the markup.
           * If it returns a list, the list is evaluated by the markupConverter
           * If it returns an object, the properties are added to the current node in the markup.
           * It may not return a function. 
  * data:
    * this parameter allows your list datastructure to be used as a template.
    * the values in the final markup are filled in with the data values from this list.
    * Both tranformation and macro functions within l are passed this parameter as described above.
 


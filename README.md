

Lisp2Markup: a lisp based template language for markup with a focus on macros.

Lisp2Markup has built in markup conversion functions and you may create your own conversion
functions by providing a taghandler.  The markup conversion

Built-In Conversions:
   toHtml: convert to html.

To make a custom markup conversion function, use the following function.

customMarkupConverter(taghandler):
  creates a custom markup conversion function using the provided taghandler function.

taghandler( tag_str,properties):
  returns [opentag_str, closetag_str]

All markup conversion functions follow the following calling pattern.

markupConverter( l,data):
  l: the template, whether a lisp string(TODO) or a javascript list datastructure, to be converted to markup.
    entries in l are handled accoring to the type of the entry:
      - lists within this list are evaluated recursively like in lisp.
      - objects are property sets which are added to current node in the markup. TODO allow using templates and macros to fill object properties.
      - a function in the first position of a list is a macro.
      - a function in a non-first position is a view function.
      - views in l are called with a data parameter which is the current context in the data.
         view( data);
         views must return a string.
      - macros in the template are called with the following parameters:
         macro( template,data,markupConverter);
           - l: the current list this macro is applied to,
                which will include the macro itself in the first position.
           - data: for templating, this is the same parameter that is passed to markupCoverter( l,data), see more below.
           - markupConverter: macros are provided the current markupConverter function so they can do more magic.

           The macro's return value is used in place of the original list with the macro.
           If it returns a string, that string is inserted into the markup.
           If it returns a list, the list is evaluated by the markupConverter
           If it returns an object, the properties are added to the current node in the markup.
           It may not return a function.
  data:
    this parameter allows your list datastructure to be used as a template.
    the values in the final markup are filled in with the data values from this list.
    Both tranformation and macro functions within l are passed this parameter as described above.
 


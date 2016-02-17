
(function(exports){

var List2Markup;
if(typeof module !== 'undefined'){
    List2Markup = require("./list2markup.js"); }
else{
    List2Markup = window.List2Markup; }

function test(){
    var css = List2Markup.macros.css;
    var foreach = List2Markup.macros.foreach;
    var get = List2Markup.macros.get;
    var _with = List2Markup.macros._with;
    var comment = List2Markup.macros.comment;

    var namelist_template = [
        [css, 
          ['body',
            ['background', [get, 'bg']],
            'font-family: sans-serif; ',
            ['max-width', '480px'],
            ['margin-left', 'auto'],
            ['margin-right', 'auto']],
          ['#main', ['position', 'relative']],
          ['#main table.namelist',
            ['border-spacing', '0px'],
            ['width', '100%'],
            ['background', '#ffffff'],
            ['margin-left', 'auto'],
            ['margin-right', 'auto']],
          ['h1.maintitle',
            ['color', '#ffffff'],
            ['background-color', [get, 'titlebg']],
            ['border-radius', function(data){
                return data.border_radius + "px"; }],
            ['padding', '50px 100px'],
            //['width', '100%'],
            ['margin', '4px 0px']],
          ['tr:nth-child(odd)',
            ['background', '#dddddd']],
          ['.firstname',
            ['text-align', 'center'],
            ['font-style', 'italic']],
          ['.lastname',
            ['text-align', 'center'],
            ['font-weight', 'bold']],
          ['tr:first-child',
            ['color', '#fff'],
            ['background', '#444']],
          ['th',
            ['text-transform', 'lowercase'],
            ['font-size', '140%'],
            ['padding', '5px']],
          'td{ padding:5px 15px; }',
        ],
        [comment, ['h1', {style:'color:white;'}, 'All this is in a comment and will be omitted.']],
        ['#main',
          ['h1.maintitle', function(data){ return data.title; }],
          ['table.namelist',
            ['tr', ['th', 'Last Name'],
                   ['th', 'First Name']],
            [_with, 'namelist',
              [foreach,
                ['tr', ['td.lastname', [_with, 1, [get]]],
                       ['td.firstname', [_with, 0, [get]]]]]],
            [foreach, 'namelist',
              ['tr', ['td.lastname', [get, 1]],
                     ['td.firstname', [get, 0]]]]]]
    ]
 
    var physics_names_data = {
       title: "Physicist Names",
       bg: "black",
       titlebg: "blue",
       border_radius: '10',
       namelist: [
         ['Isaac', 'Newton'],
         ['Marie', 'Curie'],
         ['Albert', 'Einstein'],
         ['Neils', 'Bohr'],
         ['Richard', 'Feynman'],
       ]
    }

    var html = List2Markup.toHtml( namelist_template,physics_names_data);
    console.log(html);
    return html;
}

exports.test_example = test();

})(typeof exports === 'undefined'? this['List2MarkupTest']={}: exports);


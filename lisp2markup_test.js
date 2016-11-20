
(function(exports){

var Lisp2Markup;
if(typeof module !== 'undefined'){
    Lisp2Markup = require("./lisp2markup.js"); }
else{
    Lisp2Markup = window.Lisp2Markup; }

function test(){
    var m = Lisp2Markup.macros;

    var namelist_template = [
        [m.css, 
          ['body',
            ['background', [m.get, 'bg']],
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
            ['background-color', [m.get, 'this_is_a_fake_property', [m.get, 'titlebg']]],
            ['border-radius', [m.concat, [m.get, 'border_radius'], 'px']],//function(data){
                //return data.border_radius + "px"; }],
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
        [m.comment, ['h1', {style:'color:white;'}, 'All this is in a comment and will be omitted.']],
        ['#main',
          ['h1.maintitle', function(data){ return data.title; }],
          ['table.namelist',
            ['tr', ['th', 'Last Name'],
                   ['th', 'First Name']],
            [m._with, 'namelist',
              [m.foreach,
                ['tr', ['td.lastname', [m._with, 1, [m.get]]],
                       ['td.firstname', [m._with, 0, [m.get]]]]]],
            [m.foreach, 'namelist',
              ['tr', ['td.lastname', [m.get, 1]],
                     ['td.firstname', [m.get, 0]]]]]]
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

    var html = Lisp2Markup.toHtml( namelist_template,physics_names_data);
    console.log(html);
    return html;
}

exports.test_example = test();

})(typeof exports === 'undefined'? this['Lisp2MarkupTest']={}: exports);



(function(exports){

var List2Markup;
if(typeof module !== 'undefined'){
    List2Markup = require("./list2markup.js"); }
else{
    List2Markup = window.List2Markup; }

function test(){
    var macros = List2Markup.macros;

    var namelist_template = [
        [macros.css, 
          ['body',
            ['background', [macros.get, 'bg']],
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
            ['background-color', [macros.get, 'titlebg']],
            ['border-radius', [macros.concat, [macros.get, 'border_radius'], 'px']],//function(data){
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
        [macros.comment, ['h1', {style:'color:white;'}, 'All this is in a comment and will be omitted.']],
        ['#main',
          ['h1.maintitle', function(data){ return data.title; }],
          ['table.namelist',
            ['tr', ['th', 'Last Name'],
                   ['th', 'First Name']],
            [macros._with, 'namelist',
              [macros.foreach,
                ['tr', ['td.lastname', [macros._with, 1, [macros.get]]],
                       ['td.firstname', [macros._with, 0, [macros.get]]]]]],
            [macros.foreach, 'namelist',
              ['tr', ['td.lastname', [macros.get, 1]],
                     ['td.firstname', [macros.get, 0]]]]]]
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


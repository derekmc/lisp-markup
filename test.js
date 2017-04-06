
(function(exports){

var LispMarkup;
if(typeof module !== 'undefined'){
    LispMarkup = require("./lisp_markup.js"); }
else{
    LispMarkup = window.LispMarkup; }
exports.test_example = test();

function test(){
    var m = LispMarkup.macros;

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
              ['FOREACH',
                ['tr', ['td.lastname', [m._with, 1, [m.get]]],
                       ['td.firstname', [m._with, 0, [m.get]]]]]],
            ['FOREACH', 'namelist',
              ['tr', ['td.lastname', ['GET', 1]],
                     ['td.firstname', ['GET', 0]]]]]]
    ]
 
    var lisp_template = '(#main (h1.maintitle (GET title))' +
                        '       (table.namelist' +
                        '         (tr (th Last Name) (th First Name))' +
                        '         (tr (th NameList) (td (STRINGIFY namelist)))' +
                        '         (WITH namelist' +
                        '           (FOREACH (tr (td.lastname (GET 1)) (td.firstname (GET 0)))))))';
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

    //var html = LispMarkup.toHtml( namelist_template,physics_names_data);
    //var tree = LispMarkup.lispTree(lisp_template);
    //console.log(JSON.stringify(tree));
    //var html = LispMarkup.toHtml(lisp_template, physics_names_data);
    var template = LispMarkup.compileTemplate(lisp_template);
    var html = template(physics_names_data);

    console.log(html);
    return html;
}


})(typeof exports === 'undefined'? this['LispMarkupTest']={}: exports);


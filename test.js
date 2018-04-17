
(function(exports){

    //alert("lisp-markup loaded.");
var LispMarkup;
if(typeof module !== 'undefined'){
    LispMarkup = require("./lisp_markup.js"); }
else{
    LispMarkup = window.LispMarkup; }
//LispMarkup  = 3;
exports.test_example = test();
console.log(exports.test_example);
//exports.test_example = `<h1>hey</h1>`;

function randomColor(){
    var color_list = ["#f00", "#0f0", "#00f", "#aa0", "#a0a", "#0aa"];
    return color_list[Math.floor(color_list.length * Math.random())];
}

function test(){
    var m = LispMarkup.macros;

    var json_template = [
        [m.CSS, 
          ['body',
            ['background', [m.GET, 'bg']],
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
            ['border', '3px', 'solid', 'white'],
            ['background-color', [m.GET, 'this_is_a_fake_property', [m.GET, 'titlebg']]],
            ['border-radius', [m.CONCAT, [m.GET, 'border_radius'], 'px']],//function(data){
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
        [m.COMMENT, ['h1', {style:'color:white;'}, 'All this is in a comment and will be omitted.']],
        ['#main',
          ['h1.maintitle', function(data){ return data.title; }, {style: function(){ return "background: " + randomColor() + ";"}}],
          ['table.namelist',
            ['tr', ['th', 'Last Name'],
                   ['th', 'First Name']],
            ['FOR', [], 'namelist',
              ['tr', ['td.lastname', ['GET', 1]],
                     ['td.firstname', ['GET', 0]]]]]]
    ]
 
    var lisp_template = '(#main (LET ($title (@ title)) (h1.maintitle $title)' +
                        '         (table.namelist' +
                        '           (tr (th Index) (th Last Name) (th First Name))' +
                        //'           (tr (th NameList) (td (STRINGIFY namelist)))' +
                        //'           (WITH namelist' +
                        '             (FOR () namelist (tr (td) (td.lastname (@ 1)) (td.firstname (@ 0)))))' +
                        '         (hr) (i $title)))';
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

    if(true){ //Math.random() < 0.5)
    //if(false){
        var html = LispMarkup.toHtml(json_template, physics_names_data);
        //var html = LispMarkup.toHtml(lisp_template, physics_names_data);
    }
    else{
        //var html = LispMarkup.toHtml( json_template,physics_names_data);
        var tree = LispMarkup.lispTree(lisp_template);
        console.log(JSON.stringify(tree));
        var template = LispMarkup.compileTemplate(lisp_template);
        var html = template(physics_names_data);
        /*
        */
    }

    //console.log(html);
    return html;
}


})(typeof exports === 'undefined'? this['LispMarkupTest']={}: exports);



var List2Markup = require("./list2markup.js");

// TODO
//   move macros to List2Markup module
//   implement more macros: with, css
//   in foreach macro listgetter should be optional depending on the number of arguments.
// List2Markup macros
//
// foreach -- iterate over data.
// usage: 
//   [foreach, listgetter, entrytemplate]
function foreach( l,data,list2markup){
    var result_parts = [];
    var listgetter = l[1];
    var template = l[2];
    var datalist = data;
    if(typeof listgetter == "function"){
        datalist = listgetter(data); }
    else if(typeof listgetter == "string"){
        datalist = data[listgetter]; }
    for(var i=0; i<datalist.length; ++i){
        var item = datalist[i];
        result_parts.push(list2markup(template, item)); }
    return result_parts.join(''); }

function get( l,data,list2markup){
    return data[l[1]]; }
            
//TODO
function css( l,data,list2markup){
}


function test(){

    var namelist_template = [
        [css, 
          ['body',
            ['font-family', 'sans-serif'],
            ['max-width', '480px']
            ['margin-left', 'auto'],
            ['margin-right', 'auto']],
          ['h1.maintitle',
            ['color', '#ffffff'],
            ['background-color', '#000000'],
            ['border-radius', '20px'],
            ['padding', '50px 100px'],
            ['width', '100%'],
            ['margin', '10px']],
          ['tr:nth-child(even)',
            ['background', '#cccccc']],
        ],
        ['#main',
          ['h1.maintitle', function(data){ return data.title; }],
          ['table.nametable',
            ['tr', ['th', 'First Name'],
                   ['th', 'Last Name']],
            [foreach, 'namelist',
              ['tr', ['td.firstname', [get, 0]],
                     ['td.lastname', [get, 1]]]]]]
    ]
 
    var physics_names = {
       title: "Physicist Names!",
       namelist: [
         ['Isaac', 'Newton'],
         ['Albert', 'Einstein'],
         ['Richard', 'Feynman'],
         ['Neils', 'Bohr'],
       ]
    }

    var html = List2Markup.toHtml( namelist_template,physics_names);
    console.log(html);
}

test();


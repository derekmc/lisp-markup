
(function(exports){

var List2Markup;
if(typeof module !== 'undefined'){
    List2Markup = require("./list2markup.js"); }
else{
    List2Markup = window.List2Markup; }

// TODO
//   move macros to List2Markup module
//   implement more macros: with, css
//   in foreach macro listgetter should be optional depending on the number of arguments.
// List2Markup macros
//
// foreach -- iterate over data.
// usage: 
//   [foreach, listgetter, entrytemplate]
/*
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
*/


function test(){
    var css = List2Markup.macros.css;
    var foreach = List2Markup.macros.foreach;
    var get = List2Markup.macros.get;

    var namelist_template = [
        [css, 
          ['body',
            ['background', [get, 'bg']],
            'font-family: sans-serif; ',
            ['max-width', '480px'],
            ['margin-left', 'auto'],
            ['margin-right', 'auto']],
          ['#main', ['position', 'relative']],
          ['#main .namelist',
            ['border-radius', function(data){
                return data.border_radius + "px"; }],
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
            ['margin', '10px 0px']],
          ['tr:nth-child(even)',
            ['background', '#cccccc']],
          ['.firstname',
            ['text-align', 'center'],
            ['font-style', 'italic']],
          ['.lastname',
            ['text-align', 'center'],
            ['font-weight', 'bold']],
          ['th',
            ['font-size', '140%'],
            ['padding', '5px'],
            ['color', 'white'],
            ['background', '#444'],
            ['border-radius', function(data){
                return data.border_radius + 'px'; }]],
          'td{ padding:5px 15px; }',
        ],
        ['#main',
          ['h1.maintitle', function(data){ return data.title; }],
          ['table.namelist',
            ['tr', ['th', 'First Name'],
                   ['th', 'Last Name']],
            [foreach, 'namelist',
              ['tr', ['td.firstname', [get, 0]],
                     ['td.lastname', [get, 1]]]]]]
    ]
 
    var physics_names_data = {
       title: "Physicist Names",
       bg: "black",
       titlebg: "red",
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


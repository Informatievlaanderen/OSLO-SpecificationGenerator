const fs = require("fs");
const jsonfile = require('jsonfile');
const jsonld = require('jsonld');
const ldParser = require('./linkeddataparser');


var program = require('commander');
 
program
  .version('0.8.0')
  .usage('node specgen-context.js creates a json-ld context')
  .option('-i, --input <path>', 'input file (a jsonld file)')
  .option('-o, --output <path>', 'output file (the context)')

program.on('--help', function(){
  console.log('')
  console.log('Examples:');
  console.log('  $ specgen-context --help');
  console.log('  $ specgen-context -i <input> -o <output>');
});

program.parse(process.argv);

render_context_from_json_ld_file(program.input, program.output);
console.log('done');


function render_context_from_json_ld_file(filename, output_filename) {
  console.log('start reading');
  var obj = {};
  jsonfile.readFile(filename)
  .then(
       function(obj) { 
        console.log('start processing');
       
        var context = make_context(classes(obj), properties(obj), externals(obj)); 

        console.log('start wrinting');
       
        jsonfile.writeFile(output_filename, context)
         .then(res => {
            console.log('Write complete')
          })
               .catch(error => { process.exitCode = 1; console.error(error) } )
       }
   )
    .catch(error => { process.exitCode = 1; console.error(error) } ) 
}


/* TODO: handle name clash situation
   in adresregister there are multiple status attributes, each mapped to another URI
   ensure that they are disambiguated in the context file
*/
function join_contexts(context, value, key, map) {
  if (context.has(key)) {
    console.log('warning: duplicate key ' + key + ' value ' + map[key])
  } else {
    context[key] = value
  };
  return context;

};



function make_context(classes, properties, externals) {

   console.log('make context');

   var context = new Map();
   var contextbody = new Map();
  
   if (classes !== null) {classes.forEach(function (e) { for (var key in e) {join_contexts(contextbody, e[key], key, e)  }})};
   if (properties !== null) {properties.forEach(function (e) { for (var key in e) {join_contexts(contextbody, e[key], key, e)  }})};
   if (externals !== null) {externals.forEach(function (e) { for (var key in e) {join_contexts(contextbody, e[key], key, e)  }})};


   context['@context'] = contextbody;
 
   return context;
}


/* TODO: handle classhierarchy grouping
   it should be possible to based on a class-hierarchy to create
   a context file per applicationprofile per class
   This requires knowledge in the input about the class hierarchy
*/
function map_class(c) {
    var mapping = new Map();
    mapping[c.name.nl] = c['@id'];
    return mapping;
};

function classes(json) {
   var classes = json['classes'];
   var classmapping = new Array();
   classmapping = classes.map(x => map_class(x));
   return classmapping;
}

function map_properties(prop) {
  var mapping = new Map();

  var range;
   
    if (prop.range.length === 0) {
      console.log('warning: no range for '+ prop.name.nl);
    } else {
    
    if (prop.range.length > 1) {
      console.log('warning: more than one type for '+ prop.name.nl + ' : ' + prop.range);
      range = prop.range[0];
    } else { range = prop.range[0]}} ;

    mapping[prop.name.nl] = 
      { '@id' : prop['@id'],
        '@type': range
                  };
         
//    mapping['@type'] = prop.range;
//    If the cardinality is not 1
//    mapping['@container'] = '@set';

// handle language tag literall correctly
/*
    switch (prop.range) {
      case 'http://' : 
        break;
      case '' : 
        mapping[prop.name.nl] = prop['@id'];
        break;
      default :
        mapping[prop.name.nl] = prop['@id'];
    }
*/
     
    return mapping;
}

function properties(json) {
   var props = json['properties'];

   var propertymapping = new Map();
   propertymapping = props.map(x => map_properties(x));
  
   return propertymapping;
}


function map_external(c) {
    var mapping = new Map();
  mapping[c.label.nl] = c['@id'];
    return mapping;
};

function externals(json) {
   var externs = json['externals'];

   var externalmapping = new Map();
   externalmapping = externs.map(x => map_external(x));

  
   return externalmapping;
}

/*
    var contents = fs.readFileSync(filename);
    var jsonContent = JSON.parse(contents);

        const data = new Uint8Array(Buffer.from(parsed_json));
        fs.writeFile(output_filename, data, (err) => {
            if (err) throw err;
            console.log('The file has been saved to ' + output_filename);
        });

*/
    
/*
    var promise = ldParser.parse_ontology_from_json_ld_file(filename);
    promise.then(function(parsed_json){
        var context = 'the context' 
        const data = new Uint8Array(Buffer.from(parsed_json));
        fs.writeFile(output_filename, data, (err) => {
            if (err) throw err;
            console.log('The file has been saved to ' + output_filename);
        });
    });
*/


const fs = require("fs");
const jsonfile = require('jsonfile');
const jsonld = require('jsonld');

var program = require('commander');
 
program
  .version('0.8.0')
  .usage(' creates shacl template')
  .option('-i, --input <path>', 'input file (a jsonld file)')
  .option('-o, --output <path>', 'output file (shacl)')

program.on('--help', function(){
  console.log('')
  console.log('Examples:');
  console.log('  $ specgen-shacl --help');
  console.log('  $ specgen-shacl -i <input> -o <output>');
});

program.parse(process.argv);

render_shacl_from_json_ld_file(program.input, program.output);
console.log('done');


/*
 *
 * shacl
 * template = NodeShape(targetclass, property, closed)
 */



function render_shacl_from_json_ld_file(filename, output_filename) {
  console.log('start reading');
  var obj = {};
  jsonfile.readFile(filename)
  .then(
       function(obj) { 
        console.log('start processing');
       
        var grouped = group_properties_per_class(obj);
        console.log(grouped);
        var shacl = make_shacl(grouped); 

        console.log('start writing');
       
        jsonfile.writeFile(output_filename, shacl)
         .then(res => {
            console.log('Write complete')
          })
         .catch(error => console.error(error))
       }
   )
   // .catch(error => console.error(error)) 
}



/*
 * grouep the properties per class using the domain
 */
function group_properties_per_class(json) {
    var classes = json['classes'];
    var properties = json['properties'];
    var grouped = new Map();
    var domain = [];
    var v = [];
    var vv = [];

    for (var key in classes ) {
        grouped.set(classes[key]['extra']['EA-Name'],  [])
    };
    for (var key in properties) {
	domain=[];

	if (!Array.isArray(properties[key].domain)) {
		domain = [properties[key].domain]
	} else {
		domain = properties[key].domain
	};

	for (var d in domain) {
        v = [];
	if (grouped.has(domain[d]['EA-Name'])) {
	    v = grouped.get(domain[d]['EA-Name']);
	    v.push(properties[key]);
	    grouped.set(domain[d]['EA-Name'], v)       
	} else {
	    grouped.set(domain[d]['EA-Name'],  [properties[key]]);
	}}
    };
    return grouped;
}




/*
 * TODO: create a common context
 * switch on range for objectproperty/dataproperty => class/datatype
 * support cardinality
 */
/* future todo:
 * make shape per property
 */
function make_shacl(grouped) {

   console.log('make shacl');

   var shaclTemplates = [];
   var shacl = new Map();
   var prop= new Map();
   var props =[];
 
   grouped.forEach(function(kvalue,kkey,kmap) { 
     
     shacl = new Map();
     shacl['@id'] = kkey + 'Shacl';
     shacl['@type'] = 'sh:NodeShape';
     shacl['sh:targetClass'] = kkey;
     shacl['sh:closed'] = false; 
     props=[];
     Object.entries(kvalue).forEach(
	    ([pkey, value]) => {
              prop = {
                      'sh:name' : value.name.nl,
                      'sh:description' : value.description.nl,
                      'sh:path' :value['@id'],
                      'sh:class' : value.range,
                      'sh:datatype' : value.range,
                      'sh:minCount' : 1,
                      'sh:maxCount' : 1
              };
              props.push( prop);
  	  });
     shacl['sh:property'] = props;
     shaclTemplates.push(shacl);
    });

   shacl['@context'] = {"sh": "http://www.w3.org/ns/shacl#"} ;
  
 
   return shaclTemplates;
}



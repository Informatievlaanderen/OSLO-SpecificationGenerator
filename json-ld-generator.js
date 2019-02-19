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
        
        var duplicates = identify_duplicates(obj['properties'].concat(obj['externalproperties']));
        console.log(duplicates);
        var context = make_context(classes(obj), properties(duplicates, obj), externals(obj), externalproperties(duplicates, obj)); 

        console.log('start wrinting');
       
        jsonfile.writeFile(output_filename, context)
         .then(res => {
            console.log('Write complete')
          })
               .catch(error => { console.error(error) ; process.exitCode = 1; } )
       }
   )
	.catch(error => { console.error(error); process.exitCode = 1; } ) 
}


/*
 * identify duplicates
 */
function identify_duplicates(properties) {
	/*
   var listnames = [];
   listnames = properties.map(x => map_identifier(x));
   var countnames = new Map(); 
   for (var p in listnames) {
      if (countnames.has(listnames[p])) {
          countnames.set(listnames[p], countnames.get(listnames[p]) +1);
      } else {
	  countnames.set(listnames[p],1);
       }
   }
   */
 
 var acc = new Map(); 
  acc = properties.reduce(function(accumulator, currentValue, currentIndex, array) {

	    return urireducer(accumulator, currentValue, currentIndex, array)
  },acc);

	var acc2 = new Map();
	acc.forEach(function(value, key, map) {
		if (value.length > 1) {
			acc2.set(key,value)
		}

	});

  return acc2; 
   
};


function map_identifier(prop) {
  return prop.extra['EA-Name'];
};

function urireducer(accumulator, currentValue, currentIndex, array) {
	  var currentlist = [];
	  if (accumulator.has(currentValue.extra['EA-Name']))  {
		  currentlist = accumulator.get(currentValue.extra['EA-Name']);
		  currentlist.push(currentValue['@id']);
		  accumulator.set(currentValue.extra['EA-Name'], currentlist);
	  } else {
		  accumulator.set(currentValue.extra['EA-Name'],  [currentValue['@id']]);
	  }
	  return accumulator;
};

function has_duplicates(count, prop) {

   if (count[prop] > 1) { return true } else {return false}
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



function make_context(classes, properties, externals, externalproperties) {

   console.log('make context');

   var context = new Map();
   var contextbody = new Map();
  
   if (classes !== null) {classes.forEach(function (e) { for (var key in e) {join_contexts(contextbody, e[key], key, e)  }})};
   if (properties !== null) {properties.forEach(function (e) { for (var key in e) {join_contexts(contextbody, e[key], key, e)  }})};
   if (externals !== null) {externals.forEach(function (e) { for (var key in e) {join_contexts(contextbody, e[key], key, e)  }})};
   if (externalproperties !== null) {externalproperties.forEach(function (e) { for (var key in e) {join_contexts(contextbody, e[key], key, e)  }})};


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
    mapping[c.extra['EA-Name']] = c['@id'];
    return mapping;
};

function classes(json) {
   var classes = json['classes'];
   var classmapping = new Array();
   classmapping = classes.map(x => map_class(x));
   return classmapping;
}

function map_properties(duplicates, prop) {
  var mapping = new Map();

  var range;
  var range_uri = '';
   
    if (prop.range.length === 0) {
      console.log('warning: no range for '+ prop.name.nl);
    } else {
    
    if (prop.range.length > 1) {
      console.log('warning: more than one type for '+ prop.name.nl + ' : ' + prop.range);
      range = prop.range[0];
      range_uri = range.uri;
    } else { 
      range = prop.range[0]};
      range_uri = range.uri;
    } ;
	
   key=prop.extra['EA-Name'] 
	var propc = {};
	if (duplicates.has(key)) {
	// duplicate
	domain = prop.extra['EA-Domain'];
		if (domain === "") {
			console.log("ERROR: no domain for duplicate property " + key);
			console.log("An overwrite will happen");
		} else {
		key=domain+"."+prop.extra['EA-Name'];
		}
	
	} else {
        // no duplicate
	};
	if (prop.maxCardinality != "0" & prop.maxCardinality != "1") {
      propc = { 
	      '@id' : prop['@id'],
	      '@type': range_uri,
	      '@container' : '@set'
                  };
	} else {

       propc=      { '@id' : prop['@id'],
        '@type': range_uri
                  };
	};
  // add to the map, only if it is not yet present  
  if (mapping.has(key)) {
    console.log('warning: duplicate key ' + key + ' value ' + mapping[key])
  } else {
    mapping[key] = propc
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

function properties(duplicates, json) {
   var props = json['properties'];

   var propertymapping = new Map();
   propertymapping = props.map(x => map_properties(duplicates, x));
  
   return propertymapping;
}


function map_external(c) {
    var mapping = new Map();
    if (c.extra && c.extra['EA-Name']) {
       mapping[c.extra['EA-Name']] = c['@id'];
    } else {
       console.log('Error external has no dutch label: ', c)
    };
    return mapping;
};

function externals(json) {
   var externs = json['externals'];

   var externalmapping = new Map();
   externalmapping = externs.map(x => map_external(x));

  
   return externalmapping;
}

function externalproperties(duplicates, json) {
   var externs = json['externalproperties'];

   var externalmapping = new Map();
   externalmapping = externs.map(x => map_properties(duplicates,x));

  
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


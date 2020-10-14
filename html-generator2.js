const fs = require("fs");
const jsonfile = require('jsonfile');
const jsonld = require('jsonld');
const nunjucks = require('nunjucks');
const ldParser = require('./linkeddataparser3');


var program = require('commander');
const { description } = require("commander");
 
program
  .version('0.8.0')
  .usage('node html-generator.js creates html pages for jsonld files ')
  .option('-s, --style <target>', 'target style html forms. One of {voc,ap, oj}', /^(voc|ap|oj|all)$/i)
  .option('-t, --template <template>', 'html template to render')
  .option('-d, --templatedir [directory]', 'the directory containing all templates')
  .option('-f, --forceskos', 'force the range skos:Concept for enumerated properties, default false')
  .option('-h, --hostname <hostname>', 'the public hostname/domain on which the html is published. The hostname in the input file takes precedence.')
  .option('-r, --documentpath <path>', 'the document path on which the html is published')
  .option('-x, --debug <path>', 'the intermediate json which will be used by the templaterenderer')
  .option('-m, --mainlanguage <languagecode>', 'the language to display(a languagecode string)')
  .option('-i, --input <path>', 'input file (a jsonld file)')
  .option('-l, --languageinput <path>', 'language input file (a json file)')
  .option('-o, --output <path>', 'output file (the html file)')

program.on('--help', function(){
  console.log('')
  console.log('Examples:');
  console.log('  $ html-generator --help');
  console.log('  $ html-generator -s <target> -t <template> -d <template directory> -i <input> -o <output>');
});

program.parse(process.argv);

var templatedir = program.templatedir || '/app/views';
nunjucks.configure(templatedir , {
    autoescape: true
});

render_html_from_json_ld_file(program.style, program.template, program.input, program.languageinput, program.output, program.mainlanguage);
//render_html_from_json_ld_file('voc', 'voc2.j2', '../Drafts/originalld.jsonld', '../Drafts/originallden.json', '../Drafts/outputhtml.html')
console.log('done');



function render_html_from_json_ld_file(target, template, input_filename, input_language_file, output_filename, language) {
  console.log('start reading');
  var obj = {};
  jsonfile.readFile(input_filename)
  .then(
       function(obj) { 
        jsonfile.readFile(input_language_file)
        .then(
          function (languageinput) {
            console.log('start processing');
            var promise = {};
            var hostname = program.hostname;
            var filename =  "./tempjson.jsonld"
            create_new_input_file(obj, languageinput, filename).then((myJson) => {
              jsonfile.writeFile(filename, myJson)
              .then(res => {
                console.log('Write mergefile complete');

                const forceskos = program.forceskos ? true : false;
                console.log(filename)
                switch(target) {
                    case "voc": 
                        promise = ldParser.parse_ontology_from_json_ld_file_voc(filename, hostname, language);
                        break;
                    case "ap": 
                        promise = ldParser.parse_ontology_from_json_ld_file_all(filename, hostname, forceskos, language);
                        break;
                    case "oj": 
                        promise = ldParser.parse_ontology_from_json_ld_file_oj(filename, hostname, forceskos, language);
                        break;
                    default:
                        console.log("unknown or not provided target for the html rendering");
                };

                promise.then(function(parsed_json) {
                  parsed_json.documentroot = program.documentpath;
                  if (program.debug) { 
                    jsonfile.writeFile(program.debug, parsed_json, function (err) {
                    if (err) {
                      process.exitCode = 1;
                                  console.error(err);
                                  throw err;
                                  }
                    })};
                  var html = nunjucks.render(template, parsed_json);

                  const data = new Uint8Array(Buffer.from(html));

                  console.log('start writing');
                  fs.writeFile(output_filename, data, (err) => {
                    if (err) {
                    // Set the exit code if there's a problem so bash sees it
                    process.exitCode = 1
                        throw err;
                    }
                    console.log('The file has been saved to ' + output_filename);
                    });

                  })
                  .catch(error => { console.error(error); process.exitCode = 1; } ) ;
              })
              .catch(error => { console.error(error); process.exitCode = 1 })
            })        
        })
      .catch(error => { console.error(error); process.exitCode = 1 })
    })
	.catch(error => { console.error(error); process.exitCode = 1; } ) 
}

async function create_new_input_file(input, languageinput, filename) {
  console.log('create merged file')
  var myJson = new Object
  myJson = input
  myJson.classes = getMergedObjects(input.classes, languageinput.classes)
  myJson.properties = getMergedObjects(input.properties, languageinput.properties)

  return myJson
}

//Iterate through array of the input and get the equivalent class in the updated version through their ID,
//Create new class-array for the updated objects
function getMergedObjects (inputArray, languageinputArray) {
  console.log('Checking array...')

  var newArray = new Array()
  for (var i = 0; i < languageinputArray.length; i++) {
    var currObject = languageinputArray[i]
    var elementToCompare = get_matching_object(currObject, inputArray)
    if (elementToCompare != null) {
      var newObject = merge_two_objects(elementToCompare, currObject)
      newArray.push(newObject)
    } // else the element will not be added to the new Array and therefore deleted
  }
  return newArray
}

//Iterate through properties of the input and get the equivalent property in the updated version through their ID,
//Create new property-array for the updated properties
function getMergedProperties (translatedJson, updatedJson) {
  console.log('Checking properties...')

  var propertyArray = new Array()
  for (var m = 0; m < translatedJson.properties.length; m++) {
    var input = translatedJson.properties[m]
    var elementToCompare = get_matching_property(input, updatedJson)
    if (elementToCompare != null) {
      var newProperty = get_object(elementToCompare, currClass)
      propertyArray.push(newProperty)
    }  
  }
  return propertyArray
}

function merge_two_objects (elementToCompare, currObject) {
  var newObject = elementToCompare
  for (let [key, value] of Object.entries(currObject)) {
    newObject[key] = value
  }

  return newObject
}
function get_matching_object (languageInputObject, inputArray) {
  for (i = 0; i < inputArray.length; i++) {
    if (inputArray[i]['@id'] == languageInputObject['@id']) {
      return inputArray[i]
    }
  }
  return null
}

//======================================================================================

/*
 * identify duplicates by iterating over the list and comparing if the same term is
 * being used to identify multiple values
 */
function identify_duplicates (properties) {
  var acc = new Map()
  acc = properties.reduce(function (accumulator, currentValue, currentIndex, array) {
    return urireducer(accumulator, currentValue, currentIndex, array)
  }, acc)

  // search for duplicates
  var acc2 = new Map()
  acc.forEach(function (value, key, map) {
    if (value.length > 1) {
      const tempSet = new Set(value)
      if (tempSet.length > 1) {
        // duplicate found, because more than one entry
        acc2.set(key, value)
      }
    }
  })

  return acc2
};

// auxiliary function to convert a string into CamelCase
/*
const toCamelCase = str =>
  str.toLowerCase()
    .replace(/[^a-zA-Z0-9]+(.)/g, (m, chr) => chr.toUpperCase())
    */

const capitalizeFirst = (s) => {
  if (typeof s !== 'string') return ''
  return s.charAt(0).toUpperCase() + s.slice(1)
}

// auxiliary function to convert to camelcase with dealing special cases
// TODO: what are the guidelines for contextual scoping in the labels?
function toCamelCase (str) {
  str = camelCase(str)
  // console.log(str)
  str = str.replace(/\s\(source\)/g, '(source)').replace(/\s\(target\)/g, '(target)')
  // console.log(' -> ' + str)
  return str
};

// map an entity prop to its term
function map_identifier (prop) {
  let identifier = ''
  if (program.useLabels === 'label') {
    if (prop.label && prop.label.nl) {
      identifier = toCamelCase(prop.label.nl)
      //      console.log(identifier)
    } else {
      console.log('Warning: no dutch label for entity, using fallback EA-Name')
      identifier = prop.extra['EA-Name']
      console.log('   Fallback applied for ' + identifier)
    }
  } else {
    identifier = prop.extra['EA-Name']
  };
  return identifier
};

// create a map (term -> list of uri)
function urireducer (accumulator, currentValue, currentIndex, array) {
  let currentlist = []
  const term = map_identifier(currentValue)
  if (accumulator.has(term)) {
    currentlist = accumulator.get(term)
    currentlist.push(currentValue['@id'])
    accumulator.set(term, currentlist)
  } else {
    accumulator.set(term, [currentValue['@id']])
  };
  return accumulator
};

function get_EAname (entities) {
  let acc = new Map()
  acc = entities.reduce(function (accumulator, currentValue, currentIndex, array) {
    return EAname(accumulator, currentValue, currentIndex, array)
  }, acc)

  return acc
}

// create a map (EA-Name -> term)
function EAname (accumulator, currentValue, currentIndex, array) {
  let currentlist = []
  const term = map_identifier(currentValue)
  const eaname = currentValue.extra['EA-Name']
  if (accumulator.has(eaname)) {
    currentlist = accumulator.get(eaname)
    console.log('ERROR: multiple values for the same EA-Name ' + eaname)
    console.log('       value ' + currentlist + ' will be overwritten with ' + term)
    accumulator.set(eaname, term)
  } else {
    accumulator.set(eaname, term)
  };
  return accumulator
};

// TODO: collection.js documentation does not specify
// if the values get overwritten for existing keys
//
const accContext = (accumulator, currentValue) =>
  accumulator.addEach(currentValue)

/* Same implementation as above, but maintained for debugging purposes
 */
/*
function accContextLog(accumulator, currentValue) {
 console.log('----------------------------');
 console.log(currentValue);
 accumulator.addEach(currentValue);
 console.log(accumulator);
 return accumulator
}
*/

/* Obsolete OLD accumulator implementation
 * but is kept in the source as documentation for the case to add manually
 * items in the map while checking if the key exists.
 *
*/
/*
function join_contexts (context, value, key, map) {
 console.log(key);
  if (context.has(key)) {
    console.log('warning: duplicate key ' + key + ' value ' + map.get(key))
  } else {
    context.set(key,value)
  };
  return context
};
*/

function make_context (classes, properties, externals, externalproperties) {
  console.log('make context')

  var context = new Map()
  var contextbody = new Map()

  if (classes !== null) { contextbody = classes.reduce(accContext, new Map()) }
  if (properties !== null) { contextbody = properties.reduce(accContext, contextbody) }
  if (externals !== null) { contextbody = externals.reduce(accContext, contextbody) }
  if (externalproperties !== null) { contextbody = externalproperties.reduce(accContext, contextbody) }

  context.set('@context', contextbody.toObject())

  return context
}

/* TODO: handle classhierarchy grouping
   it should be possible to based on a class-hierarchy to create
   a context file per applicationprofile per class
   This requires knowledge in the input about the class hierarchy
*/
function map_class (c) {
  const mapping = new Map()
  const identifier = map_identifier(c)
  mapping.set(capitalizeFirst(identifier), c['@id'])
  return mapping
};

function classes (json) {
  const classes = json.classes
  let classmapping = new Map()
  classmapping = classes.map(x => map_class(x))
  return classmapping
}

function map_properties (eanamesclasses, duplicates, prop) {
  var mapping = new Map()

  var range
  var range_uri = ''
  let identifier = ''

  if (prop.range.length === 0) {
    console.log('warning: no range for ' + prop.name.nl)
  } else {
    if (prop.range.length > 1) {
      console.log('warning: more than one type for ' + prop.name.nl + ' : ' + prop.range)
      range = prop.range[0]
      range_uri = range.uri
    } else {
      range = prop.range[0]
    };
    range_uri = range.uri
  } ;
  let atType = ''
  if (prop['@type'] === 'http://www.w3.org/2002/07/owl#ObjectProperty') {
    atType = '@id'
  } else {
    // assume a literal
    atType = range_uri
  };

  identifier = map_identifier(prop)
  //  console.log(identifier)
  var propc = {}
  let key = ''
  if (duplicates.has(identifier) || forceDomain) {
    //    console.log('  > found duplicate')
    // duplicate
    const domain = prop.extra['EA-Domain']
    if (domain === '') {
      console.log('ERROR: no domain found to disambiguate ' + identifier)
      console.log('An overwrite will happen')
    } else {
      key = capitalizeFirst(eanamesclasses.get(domain)) + '.' + identifier
    }
  } else {
    // no duplicate
    key = identifier
  };
  //  console.log('  > property key: ' + key)

  if (prop.maxCardinality !== '0' & prop.maxCardinality !== '1') {
    propc = {
      '@id': prop['@id'],
      '@type': atType,
      '@container': '@set' // support @language case
    }
  } else {
    propc = {
      '@id': prop['@id'],
      '@type': atType
    }
  };
  // add to the map, only if it is not yet present
  if (mapping.has(key)) {
    console.log('warning: duplicate key ' + key + ' value ' + mapping[key])
  } else {
    mapping.set(key, propc)
  };

  return mapping
}

function properties (eanamesclasses, duplicates, json) {
  var props = json.properties

  var propertymapping = new Map()
  propertymapping = props.map(x => map_properties(eanamesclasses, duplicates, x))

  return propertymapping
}

function map_external (c) {
  const mapping = new Map()
  const identifier = map_identifier(c)
  mapping.set(capitalizeFirst(identifier), c['@id'])
  return mapping
};

function externals (json) {
  const externs = json.externals

  let externalmapping = new Map()
  externalmapping = externs.map(x => map_external(x))

  return externalmapping
}

function externalproperties (eanamesclasses, duplicates, json) {
  var externs = json.externalproperties

  var externalmapping = new Map()
  externalmapping = externs.map(x => map_properties(eanamesclasses, duplicates, x))

  return externalmapping
}

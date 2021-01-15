// const fs = require('fs')
const jsonfile = require('jsonfile')
// const jsonld = require('jsonld')
const Set = require('collections/set')
const Map = require('collections/map')
const camelCase = require('camelcase')

var program = require('commander')

// delete domain & label?
program
  .version('0.8.0')
  .usage('node specgen-translation-json-update.js updates an existing translatable json based on a jsonld and a chosen prime and goallanguage')
  .option('-i, --input <path>', 'translation input file to update (a json file)')
  .option('-f, --updatedFile <path>', 'the general jsonld file of the corresponding specification (a jsonld file)')
  .option('-o, --output <path>', 'output file (a json file)')
  .option('-m, --primeLanguage <language>', 'prime language to translate to a different one (a string)')
  .option('-g, --goalLanguage <language>', 'goal language to translate into (a string)')

program.on('--help', function () {
  console.log('')
  console.log('Examples:')
  console.log('  $ specgen-context --help')
  console.log('  $ specgen-context -i <input> -f <updatedFile> -m <primeLanguage> -g <goalLanguage> -o <output>')
})

program.parse(process.argv)
const forceDomain = !!program.forceDomain

render_updated_file_from_json_ld_file(program.input, program.primeLanguage, program.goalLanguage, program.updatedFile, program.output)
//render_updated_file_from_json_ld_file('..\\Drafts\\testforupdatecreated.json', 'nl', 'en', '..\\Drafts\\testforupdateoriginal.jsonld')

console.log('done')

/* ---- end of the program --- */

function render_updated_file_from_json_ld_file(filename, primeLanguage, goalLanguage, updatedFile, outputfilename) {
  console.log('Prime Language: ' + primeLanguage)
  console.log('Goal Language: ' + goalLanguage)
  console.log('filename: ' + filename)
  console.log('updated file: ' + updatedFile)
  console.log('start reading')

  //read out both files to compare
  jsonfile.readFile(filename)
    .then(
      function (original) {
        jsonfile.readFile(updatedFile)
          .then(
            function (updated) {
              console.log('start processing')

              var myJson = compare_files(original, updated, primeLanguage, goalLanguage)
              //var output_filename = get_outputFilename (filename)

              jsonfile.writeFile(outputfilename, myJson)
                .then(res => {
                  console.log('Write complete; The original file was updated to: ' + outputfilename)
                })
                .catch(error => { console.error(error); process.exitCode = 1 })

            }
          )
          .catch(error => { console.error(error); process.exitCode = 1 })
      }
    )
    .catch(error => { console.error(error); process.exitCode = 1 })
}

function compare_files(translatedJson, updatedJson, primeLanguage, goalLanguage) {
  var json = new Object()
  var classArray = checkClasses(translatedJson, updatedJson, primeLanguage, goalLanguage)
  var propertyArray = checkProperties(translatedJson, updatedJson, primeLanguage, goalLanguage)
  var externalArray = checkExternals(translatedJson, updatedJson, primeLanguage, goalLanguage)
  var externalPropertyArray = checkExternalProperties(translatedJson, updatedJson, primeLanguage, goalLanguage)

  json = set_base_URI(json, translatedJson)
  json.classes = classArray
  json.properties = propertyArray
  json["externals"] = externalArray
  json["externalproperties"] = externalPropertyArray

  return json
}

function set_base_URI(json, translatedJson) {
  if (!(translatedJson['baseURI'] === undefined)) {
    json['baseURI'] = translatedJson['baseURI']
  }
  return json
}

//Iterate through classes of the input and get the equivalent class in the updated version through their ID,
//Create new class-array for the updated classes
function checkClasses(translatedJson, updatedJson, primeLanguage, goalLanguage) {
  console.log('Checking classes...')

  var classArray = []
  for (var i = 0; i < translatedJson.classes.length; i++) {
    var input = translatedJson.classes[i]
    var elementToCompare = get_matching_class(input, updatedJson)
    if (elementToCompare != null) {
      classArray.push(compareObject(input, elementToCompare, primeLanguage, goalLanguage, read_exisiting_attributes(input)))
    } // else the element will not be added to the new Array and therefore deleted
  }
  return classArray
}

//Iterate through external classes of the input and get the equivalent class in the updated version through their ID,
//Create new class-array for the updated classes
function checkExternals(translatedJson, updatedJson, primeLanguage, goalLanguage) {
  console.log('Checking classes...')

  var classArray = []
  for (var i = 0; i < translatedJson["externals"].length; i++) {
    var input = translatedJson["externals"][i]
    var elementToCompare = get_matching_externals(input, updatedJson)
    if (elementToCompare != null) {
      classArray.push(compareObject(input, elementToCompare, primeLanguage, goalLanguage, read_exisiting_attributes(input)))
    } // else the element will not be added to the new Array and therefore deleted
  }
  return classArray
}

//Iterate through properties of the input and get the equivalent property in the updated version through their ID,
//Create new property-array for the updated properties
function checkProperties(translatedJson, updatedJson, primeLanguage, goalLanguage) {
  console.log('Checking properties...')

  var propertyArray = []
  for (var m = 0; m < translatedJson.properties.length; m++) {
    var input = translatedJson.properties[m]
    var elementToCompare = get_matching_property(input, updatedJson)
    if (elementToCompare != null) {
      propertyArray.push(compareObject(input, elementToCompare, primeLanguage, goalLanguage, read_exisiting_attributes(input)))
    }
  }
  return propertyArray
}

//Iterate through external properties of the input and get the equivalent property in the updated version through their ID,
//Create new property-array for the updated properties
function checkExternalProperties(translatedJson, updatedJson, primeLanguage, goalLanguage) {
  console.log('Checking externalproperties...')

  var propertyArray = []
  for (var m = 0; m < translatedJson["externalproperties"].length; m++) {
    var input = translatedJson["externalproperties"][m]
    var elementToCompare = get_matching_external_property(input, updatedJson)
    if (elementToCompare != null) {
      propertyArray.push(compareObject(input, elementToCompare, primeLanguage, goalLanguage, read_exisiting_attributes(input)))
    }
  }
  return propertyArray
}

/*
iterate through arguments of the inserted objects input and updated. If updated has additional values that require translation (attributes with
language tags), add those to the input file. If some of the attributes in the existing input are deleted in the updated version, delete them, too.
*/
function compareObject(input, updated, primeLanguage, goalLanguage, keys) {
  for (let [key, value] of Object.entries(updated)) {
    if (!(updated[key] === undefined) && !(updated[key][primeLanguage] === undefined) && !(updated[key] != "")) {
      //valid means that the attribute is not just a modification of an existing attribute (e.g. label - ap-label-nl)
      var valid = value_is_valid(key, keys)
      if (valid == true) {
        if (input[key] === undefined) {
          input = add_new_field(input, updated, key, primeLanguage, goalLanguage)
        }
      }
    }// else Value has no Language tag, therefore irrelevant for this 
  }
  if (!(input === undefined)) {
    input = removeDeletedObjects(input, keys, read_exisiting_attributes(updated))
  }
  return input
}

//check if attribute still exists in updated jsonld & delete it if not
function removeDeletedObjects(input, inputkeys, updatedkeys) {
  for (var i = 0; i < inputkeys.length; i++) {
    key = inputkeys[i]
    if (!(updatedkeys.includes(key))) {
      delete input[key]
    }
  }
  return input
}

function add_new_field(input, updated, key, primeLanguage, goalLanguage) {
  input[key] = new Object()
  input[key][primeLanguage] = updated[key][primeLanguage]
  input[key][goalLanguage] = 'Please enter your translation here'
  return input
}

function read_exisiting_attributes(objects) {
  var keys = new Array()
  for (let [key, value] of Object.entries(objects)) {
    keys.push(key)
  }
  return keys
}

function get_matching_class(inputClass, updatedJson) {
  for (i = 0; i < updatedJson.classes.length; i++) {
    if (updatedJson.classes[i]['@id'] == inputClass['@id']) {
      return updatedJson.classes[i]
    }
  }
  return null
}

function get_matching_externals(inputClass, updatedJson) {
  for (i = 0; i < updatedJson["externals"].length; i++) {
    if (updatedJson["externals"][i]['@id'] == inputClass['@id']) {
      return updatedJson["externals"][i]
    }
  }
  return null
}

function get_matching_property(inputClass, updatedJson) {
  for (i = 0; i < updatedJson.properties.length; i++) {
    if (updatedJson.properties[i]['@id'] == inputClass['@id']) {
      return updatedJson.properties[i]
    }
  }
  return null
}

function get_matching_external_property(inputClass, updatedJson) {
  for (i = 0; i < updatedJson["externalproperties"].length; i++) {
    if (updatedJson["externalproperties"][i]['@id'] == inputClass['@id']) {
      return updatedJson["externalproperties"][i]
    }
  }
  return null
}


function value_is_valid(key, keys) {
  for (var index = 0; index < keys.length; index++) {
    element = keys[index]
    if (key.includes(element) === true) {
      return false
    }
  }
  return true
}

const capitalizeFirst = (s) => {
  if (typeof s !== 'string') return ''
  return s.charAt(0).toUpperCase() + s.slice(1)
}

// auxiliary function to convert to camelcase with dealing special cases
// TODO: what are the guidelines for contextual scoping in the labels?
function toCamelCase(str) {
  str = camelCase(str)
  // console.log(str)
  str = str.replace(/\s\(source\)/g, '(source)').replace(/\s\(target\)/g, '(target)')
  // console.log(' -> ' + str)
  return str
};

// map an entity prop to its term
function map_identifier(prop) {
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
function urireducer(accumulator, currentValue, currentIndex, array) {
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

// TODO: collection.js documentation does not specify
// if the values get overwritten for existing keys
//
const accContext = (accumulator, currentValue) =>
  accumulator.addEach(currentValue)

function make_context(classes, properties, externals, externalproperties) {
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
function map_class(c) {
  const mapping = new Map()
  const identifier = map_identifier(c)
  mapping.set(capitalizeFirst(identifier), c['@id'])
  return mapping
};

function classes(json) {
  const classes = json.classes
  let classmapping = new Map()
  classmapping = classes.map(x => map_class(x))
  return classmapping
}

function map_properties(eanamesclasses, duplicates, prop) {
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
  };
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

function properties(eanamesclasses, duplicates, json) {
  var props = json.properties

  var propertymapping = new Map()
  propertymapping = props.map(x => map_properties(eanamesclasses, duplicates, x))

  return propertymapping
}
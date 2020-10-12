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
  .usage('node specgen-context.js creates a json-ld context')
  .option('-i, --input <path>', 'input file (a jsonld file)')
  .option('-m, --primeLanguage <language>', 'prime language to translate to a different one (a string)')
  .option('-g, --goalLanguage <language>', 'goal language to translate into (a string)')
  .option('-d, --forceDomain', 'force the domain all the terms, instead only for those that are necessary. Default false')
  .option('-l, --useLabels <label>', 'the terms used are { label = the labels in camelCase, uml = the names from the UML},', /^(label|uml)$/i)

program.on('--help', function () {
  console.log('')
  console.log('Examples:')
  console.log('  $ specgen-context --help')
  console.log('  $ specgen-context -i <input> -m <primeLanguage> -g <goalLanugage>')
})

program.parse(process.argv)
const forceDomain = !!program.forceDomain

transform_json_ld_file_to_translatable_json(program.input, program.primeLanguage, program.goalLanguage)
console.log('done')

/* ---- end of the program --- */

function transform_json_ld_file_to_translatable_json (filename, primeLanguage, goalLanguage) {
  console.log('Prime Language: ' + primeLanguage)
  console.log('Goal Language: ' + goalLanguage)
  console.log('start reading')
  jsonfile.readFile(filename)
    .then(
      function (obj) {
        console.log('start processing')
        
        var myJson = get_shortened_json(obj, primeLanguage, goalLanguage)
        
        var output_filename = get_outputFilename (filename, goalLanguage)
        jsonfile.writeFile(output_filename, myJson)
          .then(res => {
            console.log('Write complete')
          })
          .catch(error => { console.error(error); process.exitCode = 1 })
      }
    )
    .catch(error => { console.error(error); process.exitCode = 1 })
}

//reading/writing the relevant values
function get_shortened_json (input, primeLanguage, goalLanguage) {
  var json = new Object()
  var classArray = new Array(Object)
  var propertyArray = new Array(Object)
  
  for (i = 0; i < input.classes.length; i++) {
    classArray[i] = create_shortened_class(input.classes[i], primeLanguage, goalLanguage)
  }

  for (i = 0; i < input.properties.length; i++) {
    propertyArray[i] = create_shortened_property(input.properties[i], primeLanguage, goalLanguage)
  }
  
  json['baseURI'] = input['baseURI']
  json.classes = classArray
  json.properties = propertyArray
  return json
}

//checks mandatory values: name, label, definintion, description & adds the id
function create_shortened_class (classObject, prime, goal) {
  var shortClass = new Object() 
  shortClass['@id'] = classObject['@id']
  shortClass.name = classObject.name
  shortClass.label = classObject.label
  shortClass.definition = classObject.definition
  shortClass.description = classObject.description
  shortClass.name[prime] = get_value(classObject.name[prime])
  shortClass.label[prime] = get_value(classObject.label[prime])
  shortClass.definition[prime] = get_value(classObject.definition[prime])
  shortClass.description[prime] = get_value(classObject.description[prime])
  shortClass.name[goal] = shortClass.label[goal] = shortClass.definition[goal] 
    = shortClass.description[goal] = 'Enter your translation here'

  return shortClass
}

//adds 'usage' to the necessary values
function create_shortened_property (propertiesObject, prime, goal) {
  shortProperty = create_shortened_class(propertiesObject, prime, goal)
  shortProperty.usage = propertiesObject.usage
  shortProperty.usage[prime] = get_value(propertiesObject.usage[prime])
  shortProperty.usage[goal] = 'Enter your translation here'

  return shortProperty
}

function get_value (value) {
  if (value) {
    return value
  }
  return ""
}

function get_outputFilename (filename, goalLanguage) {
  var name = new String ()
  var path = new String ()
  name = filename 
  var path = name.split('\\')
  var splitted = path[path.length-1].split('.')

  var file = name.replace(path[path.length-1], '') + splitted[splitted.length-2] + goalLanguage + '.json'
  console.log(file)
  return file
}

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

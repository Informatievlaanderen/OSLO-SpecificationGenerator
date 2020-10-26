// const fs = require('fs')
const jsonfile = require('jsonfile')
// const jsonld = require('jsonld')
const Set = require('collections/set')
const Map = require('collections/map')
const camelCase = require('camelcase')

var program = require('commander')

program
  .version('0.8.0')
  .usage('node specgen-context.js creates a json-ld context')
  .option('-i, --input <path>', 'input file (a jsonld file)')
  .option('-o, --output <path>', 'output file (the context)')
  .option('-m, --language <languagecode>', 'the language for the context (the languagecode)')
  .option('-d, --forceDomain', 'force the domain all the terms, instead only for those that are necessary. Default false')
  .option('-l, --useLabels <label>', 'the terms used are { label = the labels in camelCase, uml = the names from the UML},', /^(label|uml)$/i)

program.on('--help', function () {
  console.log('')
  console.log('Examples:')
  console.log('  $ specgen-context --help')
  console.log('  $ specgen-context -i <input> -o <output>')
  console.log('  $ specgen-context -i <input> -o <output> -l label')
})

program.parse(process.argv)
//program.useLabels = 'label'
const language = program.language
const forceDomain = !!program.forceDomain

//render_context_from_json_ld_file("..\\workbench\\Drafts\\ldmerged.jsonld", "..\\workbench\\Drafts\\ourputjsonld.json", "en")
render_context_from_json_ld_file(program.input, program.output, language)
console.log('done')

/* ---- end of the program --- */

function render_context_from_json_ld_file (filename, output_filename, language) {
  console.log('start reading')
  jsonfile.readFile(filename)
    .then(
      function (obj) {
        console.log('start processing')

        var duplicates = identify_duplicates(obj.properties.concat(obj.externalproperties), language)
        console.log('the following items have for the same term different URIs assigned:')
        console.log(duplicates)
        console.log('they will be disambiguated')
        var eanamesclasses = get_EAname(obj.classes.concat(obj.externals), language)
        var context = make_context(classes(obj, language), properties(eanamesclasses, duplicates, obj, language), externals(obj, language), externalproperties(eanamesclasses, duplicates, obj, language))

        console.log('start writing')

        jsonfile.writeFile(output_filename, context.toObject())
          .then(res => {
            console.log('Write complete, saved to: ' + output_filename)
          })
          .catch(error => { console.error(error); process.exitCode = 1 })
      }
    )
    .catch(error => { console.error(error); process.exitCode = 1 })
}

/*
 * identify duplicates by iterating over the list and comparing if the same term is
 * being used to identify multiple values
 */
function identify_duplicates (properties, language) {
  var acc = new Map()
  acc = properties.reduce(function (accumulator, currentValue, currentIndex, array) {
    return urireducer(accumulator, currentValue, currentIndex, array, language)
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
function map_identifier (prop, language) {
  let identifier = ''
  if (program.useLabels === 'label') {
    if (prop.label && prop.label[language]) {
      identifier = toCamelCase(prop.label[language])
      //      console.log(identifier)
    } else {
      console.log('Warning: no ' + language + ' label for entity, using fallback EA-Name')
      identifier = prop.extra['EA-Name']
      console.log('   Fallback applied for ' + identifier)
    }
  } else {
    identifier = prop.extra['EA-Name']
  };
  return identifier
};

// create a map (term -> list of uri)
function urireducer (accumulator, currentValue, currentIndex, array, language) {
  let currentlist = []
  const term = map_identifier(currentValue, language)
  if (accumulator.has(term)) {
    currentlist = accumulator.get(term)
    currentlist.push(currentValue['@id'])
    accumulator.set(term, currentlist)
  } else {
    accumulator.set(term, [currentValue['@id']])
  };
  return accumulator
};

function get_EAname (entities, language) {
  let acc = new Map()
  acc = entities.reduce(function (accumulator, currentValue, currentIndex, array) {
    return EAname(accumulator, currentValue, currentIndex, array, language)
  }, acc)

  return acc
}

// create a map (EA-Name -> term)
function EAname (accumulator, currentValue, currentIndex, array, language) {
  let currentlist = []
  const term = map_identifier(currentValue, language)
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
function map_class (c, language) {
  const mapping = new Map()
  const identifier = map_identifier(c, language)
  mapping.set(capitalizeFirst(identifier), c['@id'])
  return mapping
};

function classes (json, language) {
  const classes = json.classes
  let classmapping = new Map()
  classmapping = classes.map(x => map_class(x, language))
  return classmapping
}

function map_properties (eanamesclasses, duplicates, prop, language) {
  var mapping = new Map()

  var range
  var range_uri = ''
  let identifier = ''

  if (prop.range.length === 0) {
    console.log('warning: no range for ' + prop.name[language])
  } else {
    if (prop.range.length > 1) {
      console.log('warning: more than one type for ' + prop.name[language] + ' : ' + prop.range)
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

  identifier = map_identifier(prop, language)
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

function properties (eanamesclasses, duplicates, json, language) {
  var props = json.properties

  var propertymapping = new Map()
  propertymapping = props.map(x => map_properties(eanamesclasses, duplicates, x, language))

  return propertymapping
}

function map_external (c, language) {
  const mapping = new Map()
  const identifier = map_identifier(c, language)
  mapping.set(capitalizeFirst(identifier), c['@id'])
  return mapping
};

function externals (json, language) {
  const externs = json.externals

  let externalmapping = new Map()
  externalmapping = externs.map(x => map_external(x, language))

  return externalmapping
}

function externalproperties (eanamesclasses, duplicates, json, language) {
  var externs = json.externalproperties

  var externalmapping = new Map()
  externalmapping = externs.map(x => map_properties(eanamesclasses, duplicates, x, language))

  return externalmapping
}

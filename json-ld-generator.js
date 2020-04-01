const fs = require('fs')
const jsonfile = require('jsonfile')
const jsonld = require('jsonld')

var program = require('commander')

program
  .version('0.8.0')
  .usage('node specgen-context.js creates a json-ld context')
  .option('-i, --input <path>', 'input file (a jsonld file)')
  .option('-o, --output <path>', 'output file (the context)')
  .option('-l, --useLabels <label>', 'the terms used are { label = the labels in camelCase, uml = the names from the UML},', /^(label|uml)$/i)

program.on('--help', function () {
  console.log('')
  console.log('Examples:')
  console.log('  $ specgen-context --help')
  console.log('  $ specgen-context -i <input> -o <output>')
  console.log('  $ specgen-context -i <input> -o <output> -l label')
})

program.parse(process.argv)

console.log(program.useLabels)
render_context_from_json_ld_file(program.input, program.output)
console.log('done')

function render_context_from_json_ld_file (filename, output_filename) {
  console.log('start reading')
  jsonfile.readFile(filename)
    .then(
      function (obj) {
        console.log('start processing')

        var duplicates = identify_duplicates(obj.properties.concat(obj.externalproperties))
        console.log('the following items have for the same term different URIs assigned:')
        console.log(duplicates)
        var context = make_context(classes(obj), properties(duplicates, obj), externals(obj), externalproperties(duplicates, obj))

        console.log('start wrinting')

        jsonfile.writeFile(output_filename, context)
          .then(res => {
            console.log('Write complete')
          })
          .catch(error => { console.error(error); process.exitCode = 1 })
      }
    )
    .catch(error => { console.error(error); process.exitCode = 1 })
}

/*
 * identify duplicates
 */
function identify_duplicates (properties) {
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

  var acc = new Map()
  acc = properties.reduce(function (accumulator, currentValue, currentIndex, array) {
     return urireducer(accumulator, currentValue, currentIndex, array)
  }, acc)

  var acc2 = new Map()
  acc.forEach(function (value, key, map) {
    if (value.length > 1) {
      acc2.set(key, value)
    }
  })

  return acc2
};

const toCamelCase = str =>
  str.toLowerCase()
    .replace(/[^a-zA-Z0-9]+(.)/g, (m, chr) => chr.toUpperCase())

// map an entity to its term
function map_identifier (prop) {
  let identifier = ''
  if (program.useLabels === 'label') {
    if (prop.label && prop.label.nl) {
      identifier = toCamelCase(prop.label.nl)
      console.log(identifier)
    } else {
      console.log('Warning: no dutch label for entity, using fallback EA-Name')
      identifier = prop.extra['EA-Name']
    }
  } else {
    identifier = prop.extra['EA-Name']
  };
  return identifier
};

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

function has_duplicates (count, prop) {
  if (count[prop] > 1) { return true } else { return false }
}

/* TODO: handle name clash situation
   in adresregister there are multiple status attributes, each mapped to another URI
   ensure that they are disambiguated in the context file
*/
function join_contexts (context, value, key, map) {
  if (context.has(key)) {
    console.log('warning: duplicate key ' + key + ' value ' + map[key])
  } else {
    context[key] = value
  };
  return context
};

function make_context (classes, properties, externals, externalproperties) {
  console.log('make context')

  var context = new Map()
  var contextbody = new Map()

  console.log(classes)
  if (classes !== null) { classes.forEach(function (e) { for (var key in e) { join_contexts(contextbody, e[key], key, e) } }) };
  console.log(properties)
  if (properties !== null) { properties.forEach(function (e) { for (var key in e) { join_contexts(contextbody, e[key], key, e) } }) };
  console.log(externals)
  if (externals !== null) { externals.forEach(function (e) { for (var key in e) { join_contexts(contextbody, e[key], key, e) } }) };
  console.log(externalproperties)
  if (externalproperties !== null) { externalproperties.forEach(function (e) { for (var key in e) { join_contexts(contextbody, e[key], key, e) } }) };

  context['@context'] = contextbody

  return context
}

/* TODO: handle classhierarchy grouping
   it should be possible to based on a class-hierarchy to create
   a context file per applicationprofile per class
   This requires knowledge in the input about the class hierarchy
*/
function map_class (c) {
  var mapping = new Map()
  const identifier = map_identifier(c)
  mapping[identifier] = c['@id']
  return mapping
};

function classes (json) {
  var classes = json.classes
  var classmapping = [];
  classmapping = classes.map(x => map_class(x))
  return classmapping
}

function map_properties (duplicates, prop) {
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
  console.log(identifier)
  var propc = {}
	let key = ''
  if (duplicates.has(identifier)) {
    console.log('  > found duplicate')
    // duplicate
    let domain = prop.extra['EA-Domain']
    if (domain === '') {
      console.log('ERROR: no domain for duplicate property ' + identifier)
      console.log('An overwrite will happen')
    } else {
      key = domain + '.' + identifier
    }
  } else {
    // no duplicate
    key = identifier
  };
  console.log('  > property key: ' + key)

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
    mapping[key] = propc
  };

  return mapping
}

function properties (duplicates, json) {
  var props = json.properties

  var propertymapping = new Map()
  propertymapping = props.map(x => map_properties(duplicates, x))

  return propertymapping
}

function map_external (c) {
  var mapping = new Map()
  const identifier = map_identifier(c)
  mapping[identifier] = c['@id']
  return mapping
};

function externals (json) {
  var externs = json.externals

  var externalmapping = new Map()
  externalmapping = externs.map(x => map_external(x))

  return externalmapping
}

function externalproperties (duplicates, json) {
  var externs = json.externalproperties

  var externalmapping = new Map()
  externalmapping = externs.map(x => map_properties(duplicates, x))

  return externalmapping
}

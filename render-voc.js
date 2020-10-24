 const fs = require('fs')
const jsonfile = require('jsonfile')
// const jsonld = require('jsonld')
const Set = require('collections/set')
const Map = require('collections/map')
const camelCase = require('camelcase')

var program = require('commander')
const { usage, description } = require('commander')

// delete domain & label?
program
  .version('0.8.0')
  .usage('node specgen-context.js creates a json-ld context')
  .option('-i, --input <path>', 'input file to update (a json file)')
  .option('-o, --output <path>', 'output file (a jsonld file)')
  .option('-l, --language <languageCode>', 'the language of the file (a string)')
  .option('-n, --ontology <path>', 'file with additional ontology information (a jsonld file)')
  .option('-d, --ontologydefaults <path>', 'file with additional ontology defaults information (a jsonld file)')
  .option('-c, --context <path>', 'file with additional context information(a jsonld file)')

program.on('--help', function () {
  console.log('')
  console.log('Examples:')
  console.log('  $ specgen-context --help')
  console.log('  $ specgen-context -i <input> -f <updatedFile> -m <primeLanguage> -g <goalLanguage>')
})

program.parse(process.argv)
const forceDomain = !!program.forceDomain

render_voc(program.input, program.language, program.output, program.context)
//render_voc("..\\workbench\\Drafts\\originalld.jsonld", "nl", "..\\workbench\\Drafts\\voc.jsonld")
console.log('done')

/* ---- end of the program --- */
// 
function render_voc(filename, language, outputfilename, context) {
  console.log('Language: ' + language)
  console.log('File: ' + filename)

  //read out file
  jsonfile.readFile(filename)
    .then(
      function (originaljsonld) {
        var myJSON = prepare_jsonld(originaljsonld, language)
        var printableJson = pick_needed_information_from_jsonld(myJSON, language)
        printableJson = add_information_from_file(printableJson, context)
        // later same call as above for ontology and ontology defaults

        jsonfile.writeFile(outputfilename, printableJson)
          .then(res => {
            console.log('Write complete; The file was saved to: ' + outputfilename)
          })
          .catch(error => { console.error(error); process.exitCode = 1 })
      }
    )
    .catch(error => { console.error(error); process.exitCode = 1 })
}
/*    

    jq -s '.[0] + .[1] +  .[6]' /tmp/${FILE}/ontology ${CONFIGDIR}/ontology.defaults.json ${CONFIGDIR}/context >  ${TARGET}
 */

function add_information_from_file(myjson, filename) {
  console.log("Checking " + filename)
  if (!(filename === undefined) && fs.existsSync(filename)) {
    jsonfile.readFile(filename)
      .then(
        function (secondobject) {
          for (let [key, value] of Object.entries(secondobject)) {
            myjson[key] = new Object
            myjson[key] = value
          }
        }
      )
      .catch(error => { console.error(error); process.exitCode = 1 })
  }
  return myjson
}

function pick_needed_information_from_jsonld(myJsonld, language) {
  let myjson = new Object
  myjson = pick_general_information(myjson, myJsonld)
  myjson.classes = pick_classes(myJsonld, language)
  myjson.externals = pick_externals(myJsonld, "rdfs:Class")
  myjson.properties = pick_properties(myJsonld, language)
  myjson.externalproperties = pick_externals(myJsonld, "rdf:Property")
  return myjson
}

function pick_general_information(myjson, myJsonld) {
  myjson["@id"] = get_valid_value(myJsonld["@id"])
  myjson["@type"] = get_valid_value(myJsonld["@type"])
  myjson.label = get_valid_value(myJsonld.label)
  myjson["authors"] = get_valid_value(myJsonld["authors"])
  myjson["editors"] = get_valid_value(myJsonld["editors"])
  myjson["contributors"] = get_valid_value(myJsonld["contributors"])
  myjson = get_values_if_exist(myjson, myJsonld, "baseURIabbrev")
  myjson = get_values_if_exist(myjson, myJsonld, "baseURI")
  myjson = get_values_if_exist(myjson, myJsonld, "license")
  myjson = get_values_if_exist(myjson, myJsonld, "issued")
  myjson = get_values_if_exist(myjson, myJsonld, "navigation")
  myjson = get_values_if_exist(myjson, myJsonld, "namespace")
  myjson = get_values_if_exist(myjson, myJsonld, "@title")
  myjson = get_values_if_exist(myjson, myJsonld, "publication-state")
  myjson = get_values_if_exist(myjson, myJsonld, "publication-date")
  return myjson
}

function get_values_if_exist(myjson, jsonld, key) {
  if (!(jsonld[key] === undefined)) {
    myjson[key] = jsonld[key]
  }
  return myjson
}

function pick_classes(myJsonldarray, language) {
  let array
  for (let x = 0; x < myJsonldarray.length; x++) {
    let newobject = new Object
    let currobject = myJsonldarray[x]
    if (!(currobject === undefined)) {
      newobject = pick_general_attributes(currobject, newobject, language)
      newobject = get_parents(newobject, currobject)

      array.push(newobject)
    }
  }
  return array
}

//TODO right match?? 
function pick_externals(myJsonldarray, type) {
  for (let y = 0; y < myJsonldarray.length; y++) {
    var currobject = myJsonldarray[y]
    if (!(currobject.extra === undefined) && currobject.extra["Scope"] != "NOTHING") {
      let newextra = new Object
      newextra.name = get_valid_value(currobject.extra.name)
      newextra["@id"] = get_valid_value(currobject["@id"])
      newextra["@type"] = type
    }
  }
  return myJsonldarray
}

function pick_properties(properties, language) {
  let array
  for (let x = 0; x < properties.length; x++) {
    let newobject = new Object
    let currobject = properties[x]
    if (!(currobject === undefined)) {
      newobject = pick_general_attributes(currobject, newobject, language)
      newobject.domain = get_valid_value(currobject.domain)
      newobject.range = get_valid_value(currobject.range)
      newobject["generalization"] = get_valid_value(currobject["generalization"])

      array.push(newobject)
    }
  }
  return array
}

function pick_general_attributes(currobject, newobject, language) {
  newobject["@id"] = currobject["@id"]
  newobject["@type"] = currobject["@type"]
  newobject.name = get_value(newobject.name, currobject.name, language)
  newobject[description] = get_value(newobject[description], currobject[description], language)
  newobject.usage = get_value(newobject.usage, currobject.usage, language)
  return newobject
}

function get_valid_value(value) {
  if (value === undefined) {
    return null
  }
  return value
}

function get_parents(newobject, currobject) {
  if (!(currobject["parents"] === undefined)) {
    newobject["parents"] = currobject["parents"]
  }
  return newobject
}

function get_value(newobject, currobject, language) {
  if (!(currobject[language] === undefined)) {
    newobject[language] = currobject[language]
  } else {
    newobject = currobject
  }
  return newobject
}

function prepare_jsonld(json, language) {
  for (let key in json) {
    if (!(json[key] === undefined) && !(json[key][language] === undefined)) {
      json[key][language] = map_empty_strings(json[key][language])
    }
    switch (key) {
      case "range":
      case "domain":
        json[key] = map_only_uris_from_array(json[key])
        break;
      case "usage":
        json[key] = map_usage(json[key], language)
        break;
      case "foaf:mbox":
        json[key] = map_mbox(json[key])
        break;
      default:
        if (typeof json[key] == 'object') {
          json[key] = prepare_jsonld(json[key], language)
        }
        break;
    }
  }
  return json;
}

function go_on(object) {
  if (typeof object == String || typeof object === String) {
    return false
  } else if (object.length > 0) {
    return true
  }
  return false
}

function map_only_uris_from_array(array) {
  for (let i = 0; i < array.length; i++) {
    if (!(array[i] === undefined)) {
      for (let [key, value] of Object.entries(array[i])) {
        if (key != "uri") {
          delete array[i][key]
        }
      }
    }
  }
  return array
}

function map_empty_strings(string) {
  if (is_string_empty(string)) {
    return ""
  }
  else {
    return string
  }
}

function map_usage(usage, language) {
  if (is_string_empty(usage[language])) {
    return new Object
  }
  else {
    return usage
  }
}

function map_mbox(value) {
  if (is_string_empty(value)) {
    return "mailto:oslo@kb.vlaanderen.be"
  }
  else {
    return value
  }
}
function is_string_empty(string) {
  if (!(string === undefined)) {
    value = string.replace(/\s/g, '')
    if (value.length != 0) {
      return false
    }
  }
  return true
}
/*
 * identify duplicates by iterating over the list and comparing if the same term is
 * being used to identify multiple values
 */
function identify_duplicates(properties) {
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

function get_EAname(entities) {
  let acc = new Map()
  acc = entities.reduce(function (accumulator, currentValue, currentIndex, array) {
    return EAname(accumulator, currentValue, currentIndex, array)
  }, acc)

  return acc
}

// create a map (EA-Name -> term)
function EAname(accumulator, currentValue, currentIndex, array) {
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

function map_external(c) {
  const mapping = new Map()
  const identifier = map_identifier(c)
  mapping.set(capitalizeFirst(identifier), c['@id'])
  return mapping
};

function externals(json) {
  const externs = json.externals

  let externalmapping = new Map()
  externalmapping = externs.map(x => map_external(x))

  return externalmapping
}

function externalproperties(eanamesclasses, duplicates, json) {
  var externs = json.externalproperties

  var externalmapping = new Map()
  externalmapping = externs.map(x => map_properties(eanamesclasses, duplicates, x))

  return externalmapping
}

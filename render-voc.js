const jsonfile = require('jsonfile')
const program = require('commander')

program
  .version('1.0.0')
  .usage('node render-voc.js creates a vocabulary json-ld with regards to a language')
  .option('-i, --input <path>', 'input file to render (a jsonld file)')
  .option('-o, --output <path>', 'output file (a jsonld file)')
  .option('-l, --language <languageCode>', 'the language of the file (a string)')

program.on('--help', function () {
  console.log('')
  console.log('Examples:')
  console.log('  $ render-voc --help')
  console.log('  $ render-voc -i <input> -l <languagecode> -o <output>')
})

program.parse(process.argv)
const options = program.opts()

render_voc(options.input, options.language, options.output)
console.log('done')

/* --- end of the program --- */

function render_voc (filename, language, outputfilename) {
  console.log('Language: ' + language)
  console.log('File: ' + filename)

  jsonfile.readFile(filename)
    .then(
      function (originaljsonld) {
        const myJSON = prepare_jsonld(originaljsonld, language)
        const printableJson = pick_needed_information_from_jsonld(myJSON, language)

        jsonfile.writeFile(outputfilename, printableJson)
          .then(res => {
            console.log('Write complete; The file was saved to: ' + outputfilename)
          })
          .catch(error => { console.error(error); process.exitCode = 1 })
      }
    )
    .catch(error => { console.error(error); process.exitCode = 1 })
}

function pick_needed_information_from_jsonld (myJsonld, language) {
  let myjson = {}
  myjson = pick_general_information(myjson, myJsonld)
  myjson.classes = pick_classes(myJsonld.classes, language)
  myjson.externals = pick_externals(myJsonld.externals, 'rdfs:Class')
  myjson.properties = pick_properties(myJsonld.properties, language)
  myjson.externalproperties = pick_externals(myJsonld.externalproperties, 'rdf:Property')
  return myjson
}

function pick_general_information (myjson, myJsonld) {
  myjson['@id'] = get_valid_value_obj(myJsonld['@id'])
  myjson['@type'] = get_valid_value_obj(myJsonld['@type'])
  myjson.label = get_valid_value_obj(myJsonld.label)
  myjson.authors = get_valid_value_array(myJsonld.authors)
  myjson.editors = get_valid_value_array(myJsonld.editors)
  myjson.contributors = get_valid_value_array(myJsonld.contributors)
  myjson = get_values_if_exist(myjson, myJsonld, 'baseURIabbrev')
  myjson = get_values_if_exist(myjson, myJsonld, 'baseURI')
  myjson = get_values_if_exist(myjson, myJsonld, 'license')
  myjson = get_values_if_exist(myjson, myJsonld, 'issued')
  myjson = get_values_if_exist(myjson, myJsonld, 'navigation')
  myjson = get_values_if_exist(myjson, myJsonld, 'namespace')
  myjson = get_values_if_exist(myjson, myJsonld, '@title')
  myjson = get_values_if_exist(myjson, myJsonld, 'publication-state')
  myjson = get_values_if_exist(myjson, myJsonld, 'publication-date')
  return myjson
}

function get_values_if_exist (myjson, jsonld, key) {
  if (!(jsonld[key] === undefined)) {
    myjson[key] = jsonld[key]
  }
  return myjson
}

function pick_classes (myJsonldarray, language) {
  const array = []
  for (let x = 0; x < myJsonldarray.length; x++) {
    let newobject = {}
    const currobject = myJsonldarray[x]
    if (!(currobject === undefined)) {
      newobject = pick_general_attributes(currobject, newobject, language)
      newobject = get_parents(newobject, currobject)

      array.push(newobject)
    }
  }
  return array
}

function pick_externals (myJsonldarray, type) {
  const externals = []
  for (let y = 0; y < myJsonldarray.length; y++) {
    const currobject = myJsonldarray[y]
    if (!(currobject.extra === undefined) && currobject.extra.Scope !== 'NOTHING') {
      const newextra = {}
      newextra.name = get_valid_value_obj(currobject.label)
      newextra['@id'] = get_valid_value_obj(currobject['@id'])
      newextra['@type'] = type
      externals.push(newextra)
    }
  }
  return externals
}

function pick_properties (properties, language) {
  const array = []
  for (let x = 0; x < properties.length; x++) {
    let newobject = {}
    const currobject = properties[x]
    if (!(currobject === undefined)) {
      newobject = pick_general_attributes(currobject, newobject, language)
      newobject.domain = reduce_to_array_of_uris(get_valid_value_array(currobject.domain))
      newobject.range = reduce_to_array_of_uris(get_valid_value_array(currobject.range))
      newobject.generalization = get_valid_value_array(currobject.generalization)

      array.push(newobject)
    }
  }
  return array
}

function pick_general_attributes (currobject, newobject, language) {
  newobject['@id'] = currobject['@id']
  newobject['@type'] = currobject['@type']
  newobject = set_value(newobject, currobject, 'name', language)
  newobject = set_value(newobject, currobject, 'definition', language)
  newobject = set_value(newobject, currobject, 'usage', language)
  return newobject
}

function get_valid_value_obj (value) {
  if (value === undefined) {
    return {}
  }
  return value
}

function get_valid_value_array (value) {
  if (value === undefined) {
    return []
  }
  return value
}

function get_parents (newobject, currobject) {
  if (!(currobject.parents === undefined)) {
    newobject.parents = currobject.parents
  }
  return newobject
}

function set_value (newobject, object, label, language) {
  if (!(object[label] === undefined)) {
    if (!(object[label][language] === undefined)) {
      newobject[label] = {}
      newobject[label][language] = get_value(object[label][language])
    }
  }
  return newobject
}

function get_value (value) {
  if (value === 'Enter your translation here') {
    return 'A translation has yet to be added'
  } else {
    return value
  }
}

function prepare_jsonld (json, language) {
  for (const key in json) {
    if (!(json[key] === undefined) && !(json[key][language] === undefined)) {
      json[key][language] = map_empty_strings(json[key][language])
    }
    switch (key) {
      case 'range':
      case 'domain':
        // json[key] = map_only_uris_from_array(json[key])
        break
      case 'usage':
        json[key] = map_usage(json[key], language)
        break
      case 'foaf:mbox':
        json[key] = map_mbox(json[key])
        break
      default:
        if (typeof json[key] === 'object') {
          json[key] = prepare_jsonld(json[key], language)
        }
        break
    }
  }
  return json
}

function map_only_uris_from_array (array) {
  for (let i = 0; i < array.length; i++) {
    if (!(array[i] === undefined)) {
      for (const [key, value] of Object.entries(array[i])) {
        if (key !== 'uri') {
          delete array[i][key]
        }
      }
    }
  }
  return array
}

function reduce_to_array_of_uris (array) {
  const reduced = []
  for (let i = 0; i < array.length; i++) {
    if (!(array[i] === undefined)) {
      reduced[i] = array[i].uri
    }
  }
  return reduced
}

function map_empty_strings (string) {
  if (is_string_empty(string)) {
    return ''
  } else {
    return string
  }
}

function map_usage (usage, language) {
  if (is_string_empty(usage[language])) {
    return {}
  } else {
    return usage
  }
}

function map_mbox (value) {
  if (is_string_empty(value)) {
    return 'mailto:oslo@kb.vlaanderen.be'
  } else {
    return 'mailto:' + value
  }
}
function is_string_empty (string) {
  if (!(string === undefined)) {
    const value = string.replace(/\s/g, '')
    if (value.length !== 0) {
      return false
    }
  }
  return true
}

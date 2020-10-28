//const fs = require('fs')
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
  .usage('node specgen-render-voc.js creates a vocabulary json-ld with regards to a language')
  .option('-i, --input <path>', 'input file to update (a json file)')
  .option('-o, --output <path>', 'output file (a jsonld file)')
  .option('-l, --language <languageCode>', 'the language of the file (a string)')

program.on('--help', function () {
  console.log('')
  console.log('Examples:')
  console.log('  $ specgen-context --help')
  console.log('  $ specgen-context -i <input> -l <languagecode> -o <output>')
})

program.parse(process.argv)
const forceDomain = !!program.forceDomain

//render_voc(".\\Drafts\\languagemerged.jsonld", "en", ".\\tempjson.jsonld", ".\\Drafts\\test.jsonld", "", ".\\Drafts\\test3.jsonld")
render_voc(program.input, program.language, program.output)
console.log('done')

/* ---- end of the program --- */
// 
function render_voc(filename, language, outputfilename) {
  console.log('Language: ' + language)
  console.log('File: ' + filename)

  //read out file
  jsonfile.readFile(filename)
    .then(
      function (originaljsonld) {
        var myJSON = prepare_jsonld(originaljsonld, language)
        var printableJson = pick_needed_information_from_jsonld(myJSON, language)

        jsonfile.writeFile(outputfilename, printableJson)
          .then(res => {
            console.log('Write complete; The file was saved to: ' + outputfilename)
          })
          .catch(error => { console.error(error); process.exitCode = 1 })
      }
    )
    .catch(error => { console.error(error); process.exitCode = 1 })
}

function pick_needed_information_from_jsonld(myJsonld, language) {
  let myjson = new Object
  myjson = pick_general_information(myjson, myJsonld)
  myjson.classes = pick_classes(myJsonld.classes, language)
  myjson.externals = pick_externals(myJsonld.classes, "rdfs:Class")
  myjson.properties = pick_properties(myJsonld.properties, language)
  myjson.externalproperties = pick_externals(myJsonld.properties, "rdf:Property")
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
  let array = new Array
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
  var externals = new Array
  for (let y = 0; y < myJsonldarray.length; y++) {
    var currobject = myJsonldarray[y]
    if (!(currobject.extra === undefined) && currobject.extra["Scope"] != "NOTHING") {
      let newextra = new Object
      newextra.name = get_valid_value(currobject.extra.name)
      newextra["@id"] = get_valid_value(currobject["@id"])
      newextra["@type"] = type
      externals.push(newextra)
    }
  }
  return externals
}

function pick_properties(properties, language) {
  let array = new Array
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
  newobject.name = new Object
  newobject["description"] = new Object
  newobject.usage = new Object
  newobject.name[language] = get_value(currobject.name, language)
  newobject["description"][language] = get_value(currobject["description"], language)
  newobject.usage = get_value_usage(currobject.usage, language)
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

function get_value(currobject, language) {
  if (!(currobject[language] === undefined) && currobject[language] != "Enter your translation here") {
    return currobject[language]
  } else if (currobject[language] == "Enter your translation here") {
    return "A translation has yet to be added"
  } else {
    return "this line is not intended for translation"
  }
}

function get_value_usage(newobject, currobject, language) {
  if (!(currobject[language] === undefined)) {
    newobject[language] = get_value(currobject[language], language)
    return newobject
  } else {
    return new Object
  }
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
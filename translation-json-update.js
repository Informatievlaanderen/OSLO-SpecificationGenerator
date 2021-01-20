const jsonfile = require('jsonfile')
var program = require('commander')

program
  .version('1.0.0')
  .usage('node translation-json-update.js updates an existing translatable json based on a jsonld and a chosen prime and goallanguage')
  .option('-i, --input <path>', 'translation input file to update (a json file)')
  .option('-f, --updatedFile <path>', 'the general jsonld file of the corresponding specification (a jsonld file)')
  .option('-o, --output <path>', 'output file (a json file)')
  .option('-m, --primeLanguage <language>', 'prime language to translate to a different one (a string)')
  .option('-g, --goalLanguage <language>', 'goal language to translate into (a string)')

program.on('--help', function () {
  console.log('')
  console.log('Examples:')
  console.log('  $ translation-json-update --help')
  console.log('  $ translation-json-update -i <input> -f <updatedFile> -m <primeLanguage> -g <goalLanguage> -o <output>')
})

program.parse(process.argv)

render_updated_file_from_json_ld_file(program.input, program.primeLanguage, program.goalLanguage, program.updatedFile, program.output)

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
  console.log('Checking externals...')

  var classArray = []
  if (translatedJson["externals"] !== undefined) {
    for (var i = 0; i < translatedJson["externals"].length; i++) {
      var input = translatedJson["externals"][i]
      var elementToCompare = get_matching_externals(input, updatedJson)
      if (elementToCompare != null) {
        classArray.push(compareObject(input, elementToCompare, primeLanguage, goalLanguage, read_exisiting_attributes(input)))
      } // else the element will not be added to the new Array and therefore deleted
    }
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
  if (translatedJson["externalproperties"] !== undefined) {
    for (var m = 0; m < translatedJson["externalproperties"].length; m++) {
      var input = translatedJson["externalproperties"][m]
      var elementToCompare = get_matching_external_property(input, updatedJson)
      if (elementToCompare != null) {
        propertyArray.push(compareObject(input, elementToCompare, primeLanguage, goalLanguage, read_exisiting_attributes(input)))
      }
    }
  }
  return propertyArray
}

/*
iterate through arguments of the inserted objects input and updated. If updated has additional values that require translation (attributes with
language tags), add those to the input file. If some of the attributes in the existing input are deleted in the updated version, delete them, too.
*/
function compareObject(input, updated, primeLanguage, goalLanguage, keys) {
  let id = input['EA-Guid']
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
  input['EA-Guid']=id
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
    if (updatedJson.classes[i]['extra']['EA-Guid'] == inputClass['EA-Guid']) {
      return updatedJson.classes[i]
    }
  }
  return null
}

function get_matching_externals(inputClass, updatedJson) {
  for (i = 0; i < updatedJson["externals"].length; i++) {
    if (updatedJson["externals"][i]['extra']['EA-Guid'] == inputClass['EA-Guid']) {
      return updatedJson["externals"][i]
    }
  }
  return null
}

function get_matching_property(inputClass, updatedJson) {
  for (i = 0; i < updatedJson.properties.length; i++) {
    if (updatedJson.properties[i]['extra']['EA-Guid'] == inputClass['EA-Guid']) {
      return updatedJson.properties[i]
    }
  }
  return null
}

function get_matching_external_property(inputClass, updatedJson) {
  for (i = 0; i < updatedJson["externalproperties"].length; i++) {
    if (updatedJson["externalproperties"][i]['extra']['EA-Guid'] == inputClass['EA-Guid']) {
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

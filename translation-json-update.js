const jsonfile = require('jsonfile')
const program = require('commander')

// The attributes to translate
const translationAttributes = ['definition', 'label', 'usage']

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
const options = program.opts()

render_updated_file_from_json_ld_file(options.input, options.primeLanguage, options.goalLanguage, options.updatedFile, options.output)

console.log('done')

/* ---- end of the program --- */

function render_updated_file_from_json_ld_file (filename, primeLanguage, goalLanguage, updatedFile, outputfilename) {
  console.log('Prime Language: ' + primeLanguage)
  console.log('Goal Language: ' + goalLanguage)
  console.log('filename: ' + filename)
  console.log('updated file: ' + updatedFile)
  console.log('start reading')

  // read out both files to compare
  jsonfile.readFile(filename)
    .then(
      function (original) {
        jsonfile.readFile(updatedFile)
          .then(
            function (updated) {
              console.log('start processing')

              const myJson = compare_files(original, updated, primeLanguage, goalLanguage)

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

function compare_files (translatedJson, updatedJson, primeLanguage, goalLanguage) {
  let json = {}
  const classArray = checkArray('classes', translatedJson, updatedJson, primeLanguage, goalLanguage)
  const propertyArray = checkArray('properties', translatedJson, updatedJson, primeLanguage, goalLanguage)
  const externalArray = checkArray('externals', translatedJson, updatedJson, primeLanguage, goalLanguage)
  const externalPropertyArray = checkArray('externalproperties', translatedJson, updatedJson, primeLanguage, goalLanguage)

  json = set_base_URI(json, translatedJson)
  json.classes = classArray
  json.properties = propertyArray
  json.externals = externalArray
  json.externalproperties = externalPropertyArray

  return json
}

function set_base_URI (json, translatedJson) {
  if (!(translatedJson.baseURI === undefined)) {
    json.baseURI = translatedJson.baseURI
  }
  return json
}

function checkArray (type, translationjson, jsonld, primelanguage, goallanguage) {
  console.log('Checking ' + type)
  const array = []

  if (jsonld[type] !== undefined) {
    for (let m = 0; m < jsonld[type].length; m++) {
      const input = jsonld[type][m]
      const elementToCompare = get_matching_object(type, input, translationjson)
      if (elementToCompare != null) {
        array.push(createUpdatedObject(elementToCompare, input, primelanguage, goallanguage))
      } else {
        array.push(createUpdatedObject({}, input, primelanguage, goallanguage))
      }
    }
  }

  return array
}

/*
Iterate over the list of attributes given at the start and create an updated object to go with it
*/
function createUpdatedObject (translationobject, jsonldobject, primelanguage, goallanguage) {
  let updatedObject = {}
  updatedObject.name = jsonldobject.name
  updatedObject['EA-Guid'] = jsonldobject.extra['EA-Guid']
  for (const key of translationAttributes) {
    if (primelanguage !== goallanguage) {
      updatedObject = createAttributeForDifferentLanguages(translationobject, jsonldobject, primelanguage, goallanguage, key, updatedObject)
    } else {
      createAttributeForSameLanguage(translationobject, jsonldobject, primelanguage, key, updatedObject)
    }
  }
  return updatedObject
}

/*
This function is called when the prime and goallanguage are the same. When that is the case, the updatedjson will simply get all
values as they are from the jsonld. If they have been changed since the original translation json was created, they will be tagged
as '[UPDATED]'.
*/
function createAttributeForSameLanguage (translationobject, jsonldobject, primelanguage, key, updatedObject) {
  if (jsonldobject[key] !== undefined && jsonldobject[key][primelanguage] !== undefined) {
    updatedObject[key] = {}
    if (jsonldobject[key] !== undefined &&
      jsonldobject[key][primelanguage] !== undefined) {
      if (translationobject[key] !== undefined &&
        translationobject[key][primelanguage] !== undefined) {
        console.log('trans ' + translationobject[key][primelanguage])
        console.log('jsonld ' + jsonldobject[key][primelanguage])
        if (translationobject[key][primelanguage] !== jsonldobject[key][primelanguage]) {
          if (!translationobject[key][primelanguage].includes('[UPDATED]')) {
            updatedObject[key][primelanguage] = '[UPDATED] ' + jsonldobject[key][primelanguage]
            return updatedObject
          }
        }
      }
    }
    updatedObject[key][primelanguage] = jsonldobject[key][primelanguage]
  }
  return updatedObject
}

/*
If two different languages are given, this method will compare the jsonld and json input based on a defined attribute.
If that attribute is not present in the jsonld, it won't be in the updated translation json. If it is, there first is determined
if the attribute was already translated. If so, it will get the additional tag '[UPDATED]' when the attribute's value for the prime
language has been changed. If not the translation is simply kept. If there is no translation present, the goallanguage will have
the value 'Enter your translation here'.
*/
function createAttributeForDifferentLanguages (translationobject, jsonldobject, primelanguage, goallanguage, key, updatedObject) {
  if (jsonldobject[key] !== undefined && jsonldobject[key][primelanguage] !== undefined) {
    updatedObject[key] = {}
    updatedObject[key][primelanguage] = jsonldobject[key][primelanguage]
    if (translationobject[key] !== undefined && translationobject[key][goallanguage] !== undefined) {
      if (translationobject[key][primelanguage] !== jsonldobject[key][primelanguage] &&
        !translationobject[key][goallanguage].includes('[UPDATED]') &&
        translationobject[key][goallanguage] !== 'Enter your translation here') {
        updatedObject[key][goallanguage] = '[UPDATED] ' + translationobject[key][goallanguage]
      } else {
        updatedObject[key][goallanguage] = translationobject[key][goallanguage]
      }
    } else {
      updatedObject[key][goallanguage] = 'Enter your translation here'
    }
  }
  return updatedObject
}

function get_matching_object (type, inputClass, translationJson) {
  for (let i = 0; i < translationJson[type].length; i++) {
    if (translationJson[type][i]['EA-Guid'] === inputClass.extra['EA-Guid']) {
      return translationJson[type][i]
    }
  }
  return null
}

const jsonfile = require('jsonfile')
const program = require('commander')

program
  .version('2.0.0')
  .usage('node translation-json-generator.js creates a translatable json based on a jsonld and a chosen prime and goallanguage')
  .option('-i, --input <path>', 'input file (a jsonld file)')
  .option('-o, --output <path>', 'output file (a json file)')
  .option('-m, --primeLanguage <language>', 'prime language to translate to a different one (a string)')
  .option('-g, --goalLanguage <language>', 'goal language to translate into (a string)')

program.on('--help', function () {
  console.log('')
  console.log('Examples:')
  console.log('  $ translation-json-generator --help')
  console.log('  $ translation-json-generator -i <input> -m <primeLanguage> -g <goalLanugage> -o <outputfile>')
})

program.parse(process.argv)
const options = program.opts()

transform_json_ld_file_to_translatable_json(options.input, options.primeLanguage, options.goalLanguage, options.output)
console.log('done')

function transform_json_ld_file_to_translatable_json (filename, primeLanguage, goalLanguage, outputfile) {
  console.log('Prime Language: ' + primeLanguage)
  console.log('Goal Language: ' + goalLanguage)
  console.log('start reading')
  jsonfile.readFile(filename)
    .then(
      function (obj) {
        console.log('start processing')

        const myJson = get_shortened_json(obj, primeLanguage, goalLanguage)

        jsonfile.writeFile(outputfile, myJson)
          .then(res => {
            console.log('Write complete')
            console.log('the file was saved to: ' + outputfile)
          })
          .catch(error => { console.error(error); process.exitCode = 1 })
      }
    )
    .catch(error => { console.error(error); process.exitCode = 1 })
}

function get_shortened_json (input, primeLanguage, goalLanguage) {
  const json = {}
  const classArray = []
  const propertyArray = []
  const datatypesArray = []
  const referencedEntitiesArray = []

  if (primeLanguage !== goalLanguage) {
    for (let i = 0; i < input.classes.length; i++) {
      classArray[i] = create_shortened_object(input.classes[i], primeLanguage, goalLanguage)
    }
    for (let i = 0; i < input.attributes.length; i++) {
      propertyArray[i] = create_shortened_object(input.attributes[i], primeLanguage, goalLanguage)
    }
    for (let i = 0; i < input.datatypes.length; i++) {
      datatypesArray[i] = create_shortened_object(input.datatypes[i], primeLanguage, goalLanguage)
    }
    for (let i = 0; i < input.referencedEntities.length; i++) {
      referencedEntitiesArray[i] = create_shortened_object(input.referencedEntities[i], primeLanguage, goalLanguage)
    }
  } else {
    console.log('WARNING The entered language values are the same!')
  }

  json['@id']   = input['@id']
  json.generatedAtTime = input.generatedAtTime
  json.classes = classArray
  json.attributes = propertyArray
  json.datatypes = datatypesArray
  json.referencedEntities = referencedEntitiesArray
  return json
}

// checks mandatory values: label, definintion, usage & adds the Ea-Guid
function create_shortened_object_one_language (classObject, language) {
  let shortClass = {}
  shortClass['EA-Guid'] = classObject.extra['EA-Guid']
  shortClass = set_name(shortClass, classObject, language, language)
  shortClass = get_one_langue_value(shortClass, classObject, 'label', language)
  shortClass = get_one_langue_value(shortClass, classObject, 'definition', language)
  shortClass = get_one_langue_value(shortClass, classObject, 'usage', language)

  return shortClass
}

function get_one_langue_value (shortClass, classObject, attribute, language) {
  if (!(classObject[attribute] === undefined)) {
    shortClass[attribute] = classObject[attribute]
    shortClass[attribute][language] = classObject[attribute][language]
  }
  return shortClass
}

function create_shortened_object (object, prime, goal) {
  let shortObject = {}
  shortObject['@id']   = object['@id']
  shortObject.assignedURI   = object.assignedURI
//  shortObject.apLabel       = object.apLabel
  shortObject = get_attribute(shortObject, object, 'vocLabel', prime, goal)
  shortObject = get_attribute(shortObject, object, 'apLabel', prime, goal)
  shortObject = get_attribute(shortObject, object, 'vocDefinition', prime, goal)
  shortObject = get_attribute(shortObject, object, 'apDefinition', prime, goal)
  shortObject = get_attribute(shortObject, object, 'vocUsageNote', prime, goal)
  shortObject = get_attribute(shortObject, object, 'apUsageNote', prime, goal)
  
//  shortObject = get_attribute(shortObject, object, 'definition', prime, goal)
//  shortObject = get_attribute(shortObject, object, 'usage', prime, goal)
  return shortObject
}

function set_name (shortObject, originalObject, prime, goal) {
  if (!(originalObject.name === undefined)) {
    shortObject.name = originalObject.name
  } else {
    shortObject.name = ''
  }
  return shortObject
}

function get_attribute_old (shortObject, originalObject, attribute, prime, goal) {
  if (!(originalObject[attribute] === undefined)) {
    shortObject[attribute] = originalObject[attribute]
    if (!(originalObject[attribute][prime] === undefined)) {
      shortObject[attribute][prime] = originalObject[attribute][prime]
      shortObject[attribute][goal] = 'Enter your translation here'
    }
  }
  return shortObject
}

// assume that prime is the only value
function get_attribute (shortObject, originalObject, attribute, prime, goal) {
  let original = originalObject[attribute]
  if (!(original === undefined)) {
    let other = {}
    other["@language"] = goal,
    other["@value"] = 'Enter your translation here'
    original.push(other)
    shortObject[attribute] = original
  }
  return shortObject
}

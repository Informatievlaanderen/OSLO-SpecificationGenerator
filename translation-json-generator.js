const jsonfile = require('jsonfile')
const program = require('commander')

program
  .version('1.0.0')
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
  const externalArray = []
  const externalPropertyArray = []

  if (primeLanguage !== goalLanguage) {
    for (let i = 0; i < input.classes.length; i++) {
      classArray[i] = create_shortened_object(input.classes[i], primeLanguage, goalLanguage)
    }
    for (let i = 0; i < input.properties.length; i++) {
      propertyArray[i] = create_shortened_object(input.properties[i], primeLanguage, goalLanguage)
    }
    for (let i = 0; i < input.externals.length; i++) {
      externalArray[i] = create_shortened_object(input.externals[i], primeLanguage, goalLanguage)
    }
    for (let i = 0; i < input.externalproperties.length; i++) {
      externalPropertyArray[i] = create_shortened_object(input.externalproperties[i], primeLanguage, goalLanguage)
    }
  } else {
    console.log('WARNING The entered language values are the same!')
    for (let i = 0; i < input.classes.length; i++) {
      classArray[i] = create_shortened_object_one_language(input.classes[i], primeLanguage)
    }
    for (let i = 0; i < input.properties.length; i++) {
      propertyArray[i] = create_shortened_object_one_language(input.properties[i], primeLanguage)
    }
    for (let i = 0; i < input.externals.length; i++) {
      externalArray[i] = create_shortened_object_one_language(input.externals[i], primeLanguage)
    }
    for (let i = 0; i < input.externalproperties.length; i++) {
      externalPropertyArray[i] = create_shortened_object_one_language(input.externalproperties[i], primeLanguage)
    }
  }

  json.baseURI = input.baseURI
  json.classes = classArray
  json.properties = propertyArray
  json.externals = externalArray
  json.externalproperties = externalPropertyArray
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
  shortObject['EA-Guid'] = object.extra['EA-Guid']
  shortObject = set_name(shortObject, object, prime, goal)
  shortObject = get_attribute(shortObject, object, 'label', prime, goal)
  shortObject = get_attribute(shortObject, object, 'definition', prime, goal)
  shortObject = get_attribute(shortObject, object, 'usage', prime, goal)
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

function get_attribute (shortObject, originalObject, attribute, prime, goal) {
  if (!(originalObject[attribute] === undefined)) {
    shortObject[attribute] = originalObject[attribute]
    if (!(originalObject[attribute][prime] === undefined)) {
      shortObject[attribute][prime] = originalObject[attribute][prime]
      shortObject[attribute][goal] = 'Enter your translation here'
    }
  }
  return shortObject
}

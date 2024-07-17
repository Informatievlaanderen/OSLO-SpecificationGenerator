const jsonfile = require('jsonfile')
const program = require('commander')
const translationlib = require('./translation-json-lib')

program
  .version('2.0.0')
  .usage('node translation-json-generator.js creates a translatable json based on a jsonld and a chosen prime and goallanguage')
  .option('-i, --input <path>', 'input file (a jsonld file)')
  .option('-t, --translation <path>', 'a corresponding translation file (a json file)')
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
  console.log('start reading')
  jsonfile.readFile(filename)
    .then(
      function (input) {
        console.log('start processing')

	let myJson = {}

	if (options.translation === null ) {
             myJson = get_shortened_json(input, primeLanguage, goalLanguage)
		jsonfile.writeFile(outputfile, myJson)
		  .then(res => {
		    console.log('Write complete')
		    console.log('the file was saved to: ' + outputfile)
		  })
		  .catch(error => { console.error(error); process.exitCode = 1 })
	} else {

		console.log('create new translation file with existing translations included')

  		jsonfile.readFile(options.translation)
    		.then(
      		function (translationJson) {

			let merged = translationlib.mergefiles(input, translationJson, primeLanguage, goalLanguage) 
             		myJson = get_shortened_json(merged, primeLanguage, goalLanguage)

		jsonfile.writeFile(outputfile, myJson)
		  .then(res => {
		    console.log('Write complete')
		    console.log('the file was saved to: ' + outputfile)
		  })
		  .catch(error => { console.error(error); process.exitCode = 1 })

		})
		.catch(error => { console.error(error); process.exitCode = 1 })
	}

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


function create_shortened_object (object, prime, goal) {
  // use this approach to ensure the order of the attributes in the json in the same order as the source
  let shortObject = {}
  shortObject['@id']   = object['@id']
  shortObject.assignedURI   = object.assignedURI
  shortObject = get_attribute(shortObject, object, 'vocLabel', prime, goal)
  shortObject = get_attribute(shortObject, object, 'apLabel', prime, goal)
  shortObject = get_attribute(shortObject, object, 'vocDefinition', prime, goal)
  shortObject = get_attribute(shortObject, object, 'apDefinition', prime, goal)
  shortObject = get_attribute(shortObject, object, 'vocUsageNote', prime, goal)
  shortObject = get_attribute(shortObject, object, 'apUsageNote', prime, goal)
  
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

// add a dummy value if the goal translation not already exists
function get_attribute (shortObject, originalObject, attribute, prime, goal) {

  let original = originalObject[attribute]
  if (!(original === undefined))  {
	  console.log(original)
    let originalgoal = translationlib.get_language_value(original, goal)
	  console.log(originalgoal)
    if ( originalgoal === null ) {
	    // if goal language already has a value keep it
    let other = {}
    other["@language"] = goal,
    other["@value"] = 'Enter your translation here'
    original.push(other)
    shortObject[attribute] = original
    } else {
	    shortObject[attribute] = original
    }
  }
  return shortObject
}

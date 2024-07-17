const jsonfile = require('jsonfile')
const program = require('commander')
const Map = require('collections/map')
const Set = require('collections/set')

program
  .version('2.0.0')
  .usage('node translation-json-update.js merges the input file with the file containing the translations for the chosen prime and goal language')
  .option('-i, --input <path>', 'base file which content will be extended with the translations (oslo internal format) ')
  .option('-f, --translationFile <path>', 'the translations for the input')
  .option('-o, --output <path>', 'the merged file obtained by combining the input file with the translations (oslo internal format)')
  .option('-m, --primeLanguage <language>', 'prime language in which the input is provided (a string)')
  .option('-g, --goalLanguage <language>', 'goal language corresponding the translations (a string)')
  .option('-u, --no-update', 'update the translations values with indications of change (per default true)')

program.on('--help', function () {
  console.log('')
  console.log('It is expected that the translation file contains the same prime language as the input file')
  console.log('Examples:')
  console.log('  $ translation-json-update --help')
  console.log('  $ translation-json-update -i <input> -f <translations> -m <primeLanguage> -g <goalLanguage> -o <output>')
})

program.parse(process.argv)
const options = program.opts()

render_updated_file_from_json_ld_file(options.input, options.primeLanguage, options.goalLanguage, options.translationFile, options.output)

console.log('done')

/* ---- end of the program --- */

function render_updated_file_from_json_ld_file (inputfilename, primeLanguage, goalLanguage, translationFilename, outputfilename) {
  console.log('start reading')

  // read out both files to compare
  jsonfile.readFile(inputfilename)
    .then(
      function (input) {
        jsonfile.readFile(translationFilename)
          .then(
            function (translation) {
              console.log('start processing')

              const output = mergefiles(input, translation, primeLanguage, goalLanguage)

              jsonfile.writeFile(outputfilename, output)
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

function mergefiles (input, translation, primeLanguage, goalLanguage) {
  let mergeArrays = ['classes', 'attributes', 'referencedEntities', 'datatypes']

  const output = mergeArrays.reduce(function (acc, elem) {
//	  console.log(elem)
    mergeJsonArray(acc, elem, input, translation, primeLanguage, goalLanguage)
    return acc
  }, input)

  return output
}



function mergeJsonArray(accOutput, array, input, translation, primeLanguage, goalLanguage) {
  //console.log('Checking Array' + array)

  let iArray = input[array]
  const oArray = iArray.reduce(function (acc, elem) {

    acc.push(mergeElement(elem, translation[array], primeLanguage, goalLanguage))
    return acc
  }, [])
  accOutput[array]=oArray

  return accOutput
}


function mergeElement(element, translationArray, primeLanguage, goalLanguage) {

	// need to make use of emptyElement otherwise subsequent test is always false
  let oElement = {}
  let emptyElement = {}
  oElement = translationArray.reduce(function (acc, elem) {
	  if ( elem['@id'] === element['@id'] ) {
		acc = mergeIdentifiedElements(elem, element, primeLanguage, goalLanguage)  
	  } 
		return acc
  }, emptyElement)
  if ( oElement == emptyElement ) {
	  console.log('new term introduced, no translation found')
	  oElement = mergeIdentifiedElements(element, element, primeLanguage, goalLanguage)  
  }

  return oElement
}

//
// merge a translated element together with the original input
//
// This requires also checking if the orignal attribute has the same prime language value
// If not the case then the translation must be updated with an additional indication "UPDATED"
//
function mergeIdentifiedElements(translation, input, primeLanguage, goalLanguage) {

	let translationAttributes =['vocLabel', 'apLabel', 'vocDefinition', 'apDefinition', 'vocUsageNote', 'apUsageNote']

	let output = translationAttributes.reduce(function (acc, elem) {
		acc = set_attribute_translation(acc, translation, elem, primeLanguage, goalLanguage) 
		return acc
	}, input)

	return output

}

function set_attribute_translation (input, translation, attribute, prime, goal) {
  let originalA = input[attribute]
  let translationA = translation[attribute]

  if (originalA === undefined) {
	  originalA = []
  }
  if (translationA === undefined) {
	  translationA = []
  }
 
  // check coherency prime language
  let originalAprime = get_language_value(originalA, prime)
  let translationAprime = get_language_value(translationA, prime)

  let other = {}
  let translationAgoal = get_language_value(translationA, goal)

  if (originalAprime === null ) {
	  // prime value does not exists

	  if (translationAprime !== null) {
		  // a translation is provided for a non existing prime language
             other["@language"] = goal
	     if ( options.update ) {
                  other["@value"] = 'TODO TRANSLATION PROVIDED BUT NO ORIGINAL VALUE:' + get_language_value(translationA, goal)
	     } else {
                  other["@value"] = get_language_value(translationA, goal)
		  other.changes = true
	     }
		 
             originalA.push(other)
             input[attribute] = originalA
	  } 

  } else if (originalAprime !== translationAprime) {
      // prime value in input has changed !

    if (translationAgoal === null) {
	    // no translation is provided
	    translationAgoal = 'NO TRANSLATION PROVIDED'
    }

    other["@language"] = goal
    if (options.update) {
        other["@value"] = 'TODO UPDATED:' + get_language_value(translationA, goal)
     } else {
        other["@value"] = get_language_value(translationA, goal)
       other.changes = true
    }
    originalA.push(other)
    input[attribute] = originalA
  } else {
      // prime language values are the same
    if (translationAgoal === null) {
	    // no translation is provided
	    translationAgoal = 'TODO NO TRANSLATION PROVIDED'
    }
    other["@language"] = goal,
    other["@value"] = translationAgoal
    originalA.push(other)
    input[attribute] = originalA
  }

  return  input
}

function get_language_value(languageArray, language) {
    for (let i = 0; i < languageArray.length; i++) {
	    if (languageArray[i]['@language'] === language) {
		    return languageArray[i]['@value']
	    }
    }
    return null
}


function make_new_translation(element, goalLanguage) {
	return element
}


function checkArray (type, translationjson, jsonld, primelanguage, goallanguage) {
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


const Map = require('collections/map')
const Set = require('collections/set')

function mergefiles (input, translation, primeLanguage, goalLanguage) {
  let mergeArrays = ['classes', 'attributes', 'referencedEntities', 'datatypes']

  const output = mergeArrays.reduce(function (acc, elem) {
    mergeJsonArray(acc, elem, input, translation, primeLanguage, goalLanguage)
    return acc
  }, input)

  return output
}



function mergeJsonArray(accOutput, array, input, translation, primeLanguage, goalLanguage) {
  console.log('Checking Array' + array)

  let iArray = input[array]
  const oArray = iArray.reduce(function (acc, elem) {

    acc.push(mergeElement(elem, translation[array], primeLanguage, goalLanguage))
    return acc
  }, [])
  accOutput[array]=oArray

  return accOutput
}


function mergeElement(element, translationArray, primeLanguage, goalLanguage) {
	console.log(element.assignedURI)

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



module.exports = { mergefiles, get_language_value }

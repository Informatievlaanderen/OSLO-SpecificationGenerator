const Map = require('collections/map')
const Set = require('collections/set')

function mergefiles (options, input, translation, primeLanguage, goalLanguage) {
  const mergeArrays = ['classes', 'attributes', 'referencedEntities', 'datatypes']

  const output = mergeArrays.reduce(function (acc, elem) {
    mergeJsonArray(options, acc, elem, input, translation, primeLanguage, goalLanguage)
    return acc
  }, input)

  return output
}

function mergeJsonArray (options, accOutput, array, input, translation, primeLanguage, goalLanguage) {
  //console.log('Checking Array' + array)

  const iArray = input[array]
  const oArray = iArray.reduce(function (acc, elem) {
    acc.push(mergeElement(options, elem, translation[array], primeLanguage, goalLanguage))
    return acc
  }, [])
  accOutput[array] = oArray

  return accOutput
}

function mergeElement (options, element, translationArray, primeLanguage, goalLanguage) {
  //console.log(element.assignedURI)

  // need to make use of emptyElement otherwise subsequent test is always false
  let oElement = {}
  const emptyElement = {}
  oElement = translationArray.reduce(function (acc, elem) {
     if (elem['@id'] === element['@id']) {
      acc = mergeIdentifiedElements(options, elem, element, primeLanguage, goalLanguage)
     }
    return acc
  }, emptyElement)
  if (oElement === emptyElement) {
     console.log(element.assignedURI)
     console.log('new term introduced, no translation found')
     oElement = mergeIdentifiedElements(options, element, element, primeLanguage, goalLanguage)
  }

  return oElement
}

//
// merge a translated element together with the original input
//
// This requires also checking if the orignal attribute has the same prime language value
// If not the case then the translation must be updated with an additional indication "UPDATED"
//
function mergeIdentifiedElements (options, translation, input, primeLanguage, goalLanguage) {
  const translationAttributes = ['vocLabel', 'apLabel', 'vocDefinition', 'apDefinition', 'vocUsageNote', 'apUsageNote']

  const output = translationAttributes.reduce(function (acc, elem) {
    acc = set_attribute_translation(options, acc, translation, elem, primeLanguage, goalLanguage)
    return acc
  }, input)

  return output
}

function set_attribute_translation (options, input, translation, attribute, prime, goal) {
  let originalA = input[attribute]
  let translationA = translation[attribute]

  if (originalA === undefined) {
     originalA = []
  }
  if (translationA === undefined) {
     translationA = []
  }

  // check coherency prime language
  const originalAprime = get_language_value(originalA, prime)
  const translationAprime = get_language_value(translationA, prime)

  const other = {}
  let translationAgoal = get_language_value(translationA, goal)

  if (originalAprime === null) {
     // prime value does not exists

     if (translationAprime !== null) {
        // a translation is provided for a non existing prime language
      other['@language'] = goal
        if (options.update) {
        other['@value'] = 'TODO TRANSLATION PROVIDED BUT NO ORIGINAL VALUE:' + get_language_value(translationA, goal)
        } else {
        other['@value'] = get_language_value(translationA, goal)
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

    other['@language'] = goal
    if (options.update) {
      other['@value'] = 'TODO UPDATED:' + get_language_value(translationA, goal)
    } else {
      other['@value'] = get_language_value(translationA, goal)
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
    other['@language'] = goal
    other['@value'] = translationAgoal
    originalA.push(other)
    input[attribute] = originalA
  }

  return input
}

function get_language_value (languageArray, language) {
  for (let i = 0; i < languageArray.length; i++) {
       if (languageArray[i]['@language'] === language) {
          return languageArray[i]['@value']
       }
  }
  return null
}

// if the input does not contain the base attributes update the input with empty list
function empty_object(input) {
  let output = input;

  if ((output.classes === undefined) || (output.classes === null)) { output.classes = [] }
  if ((output.attributes === undefined) || (output.attributes === null)) { output.attributes = [] }
  if ((output.datatypes === undefined) || (output.datatypes === null)) { output.datatypes = [] }
  if ((output.referencedEntities === undefined) || (output.referencedEntities === null)) { output.referencedEntities = [] }
	
	return output ;
}

module.exports = { mergefiles, get_language_value, empty_object }

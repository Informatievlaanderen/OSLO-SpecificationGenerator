const { program } = require('commander')
const fs = require('node:fs')

const endpoint = 'https://api.cognitive.microsofttranslator.com/'

// parse the command line arguments
program
  .usage(
    'node autotranslate.js creates a translation of a jsonld file based on existing values'
  )
  .requiredOption('-i, --input <path>', 'input file to translate (a jsonld file)')
  .requiredOption(
    '-g, --goalLanguage <languagecode>',
    'the language that shall be translated to (a languagecode)'
  )
  .requiredOption(
    '-m, --mainLanguage <languagecode>',
    'the language that shall be translated from (a languagecode)'
  )
  .requiredOption('-o, --output <path>', 'translated output file (a jsonld file)')
  .requiredOption(
    '-s, --subscriptionKey <key-string>',
    'Subscription key for Azure AI Translator (a String)'
  )
  .on('--help', function () {
    console.log('Examples:')
    console.log(
      '  $ node autotranslate.js -i <input> -g <languagecode> -m <languagecode> -o <output> -s <key-string>'
    )
  })

program.parse(process.argv)
const options = program.opts()

translateFile(options)

// main function to translate the json file
function translateFile (options) {
  console.log('start translating')
  const jsonObject = readJson(options.input)
  translateJson(jsonObject, options).then((translatedJsonObject) => {
    writeJson(options.output, translatedJsonObject)
  })
}

function readJson (filename) {
  console.log('start reading file ' + filename)
  try {
    const jsonFile = fs.readFileSync(filename, 'utf-8')
    const jsonObject = JSON.parse(jsonFile)
    return jsonObject
  } catch (err) {
    console.error(err)
    process.exitCode = 1
  }
}

function writeJson (filename, jsonObject) {
  console.log('start writing file ' + filename)
  try {
    fs.writeFileSync(filename, JSON.stringify(jsonObject, null, 2))
  } catch (err) {
    console.error(err)
    process.exitCode = 1
  }
}

async function translateJson (jsonObject, options) {
  console.log('start translating json')
  // Translate the json object
  jsonObject.classes = await translateObject(jsonObject.classes, options)
  jsonObject.attributes = await translateObject(jsonObject.attributes, options)
  jsonObject.referencedEntities = await translateObject(
    jsonObject.referencedEntities,
    options
  )
  jsonObject.datatypes = await translateObject(jsonObject.datatypes, options)
  return jsonObject
}

// Translate subparts of the json object
async function translateObject (object, options) {
  await Promise.all(object.map(async (item) => {
    await Promise.all([
      'vocLabel',
      'apLabel',
      'vocDefinition',
      'apDefinition',
      'apUsageNote',
      'vocUsageNote'
    ].map(async (field) => {
      if (Array.isArray(item[field])) {
        const originalObject = getLanguageValue(
          item[field],
          options.mainLanguage
        )
        // Translate the text
        if (originalObject !== null) {
          const toBeTranslatedObject = getLanguageValue(
            item[field],
            options.goalLanguage
          )
          // Check if a translation is needed
          if (
            toBeTranslatedObject !== null &&
            toBeTranslatedObject === 'Enter your translation here'
          ) {
            const translatedText = await translateText(
              originalObject,
              options
            )
            // add translated object
            const machinetranslated =
              options.goalLanguage + '-t-' + options.mainLanguage
            item[field].push({
              '@language': machinetranslated,
              '@value': translatedText
            })
            // remove original object
            item[field] = item[field].filter(
              (value) => value['@language'] !== options.goalLanguage
            )
          }
        }
      }
    }))
  }))

  return object
}

async function translateText (text, options) {
  const translatedText = await fetch(
    endpoint + '/translate?api-version=3.0&to=' + options.goalLanguage + '&from=' + options.mainLanguage,
    {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': options.subscriptionKey,
        'Ocp-Apim-Subscription-Region': 'westeurope',
        'Content-type': 'application/json'
      },
      body: JSON.stringify([{ text: text }])
    }
  )
    .then((response) => response.json())
    .then((data) => {
      return data[0].translations[0].text
    })
    .catch((error) => {
      console.error('An error occured while translating text')
      console.error('error', error)
      return 'Enter your translation here'
    }
    )
  return translatedText
}

function getLanguageValue (languageArray, language) {
  for (let i = 0; i < languageArray.length; i++) {
    if (languageArray[i]['@language'] === language) {
      return languageArray[i]['@value']
    }
  }
  return null
}

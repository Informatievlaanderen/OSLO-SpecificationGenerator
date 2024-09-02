const { program } = require('commander')
const fs = require('node:fs')

const endpoint = 'https://api.cognitive.microsofttranslator.com/'
const maxRetries = 5

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
  .requiredOption('-p', '--prefix <prefix>', 'prefix for the logging')
  .on('--help', function () {
    console.log('Examples:')
    console.log(
      '  $ node autotranslate.js -i <input> -g <languagecode> -m <languagecode> -o <output> -s <key-string>'
    )
  })

program.parse(process.argv)
const options = program.opts()
var counterCalls = 0
translateFile(options)
console.log(options.prefix + 'Number of calls: ' + counterCalls)

// main function to translate the json file
function translateFile (options) {
  console.log(options.prefix + 'start translating')
  const jsonObject = readJson(options.input, options.prefix)
  translateJson(jsonObject, options).then((translatedJsonObject) => {
    writeJson(options.output, options.prefix, translatedJsonObject)
  })
}

function readJson (filename, prefix) {
  console.log(prefix + 'start reading file ' + filename)
  try {
    const jsonFile = fs.readFileSync(filename, 'utf-8')
    const jsonObject = JSON.parse(jsonFile)
    return jsonObject
  } catch (err) {
    console.error(err)
    process.exitCode = 1
  }
}

function writeJson (filename, prefix, jsonObject) {
  console.log(prefix + 'start writing file ' + filename)
  try {
    fs.writeFileSync(filename, JSON.stringify(jsonObject, null, 2))
  } catch (err) {
    console.error(err)
    process.exitCode = 1
  }
}

async function translateJson (jsonObject, options) {
  console.log(options.prefix + 'start translating json')
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
      'vocDefinition',
      'vocUsageNote'
    ].map(async (field) => {
      let translatedText = ''
      let originalObjectVoc = null
      if (Array.isArray(item[field])) {
        originalObjectVoc = getLanguageValue(
          item[field],
          options.mainLanguage
        )
        // Translate the text for Voc
        if (originalObjectVoc !== null) {
          const toBeTranslatedObjectVoc = getLanguageValue(
            item[field],
            options.goalLanguage
          )
          // Check if a translation is needed
          if (
            toBeTranslatedObjectVoc !== null &&
            toBeTranslatedObjectVoc === 'Enter your translation here'
          ) {
            translatedText = await translateWithFallback(
              originalObjectVoc,
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
      // Translate the text for Ap
      const fieldAp = field.replace('voc', 'ap')
      if (Array.isArray(item[fieldAp])) {
        const originalObjectAp = getLanguageValue(
          item[fieldAp],
          options.mainLanguage
        )
        if (originalObjectAp !== null) {
          const toBeTranslatedObjectAp = getLanguageValue(
            item[fieldAp],
            options.goalLanguage
          )
          // Check if a translation is needed
          if (
            toBeTranslatedObjectAp !== null &&
              toBeTranslatedObjectAp === 'Enter your translation here'
          ) {
            // check if we cannot reuse the translation from the Voc
            if (originalObjectVoc === null || translatedText === '' || originalObjectAp !== originalObjectVoc) {
              translatedText = await translateWithFallback(
                originalObjectAp,
                options
              )
            }
            // add translated object
            const machinetranslated =
                options.goalLanguage + '-t-' + options.mainLanguage
            item[fieldAp].push({
              '@language': machinetranslated,
              '@value': translatedText
            })
            // remove original object
            item[fieldAp] = item[fieldAp].filter(
              (value) => value['@language'] !== options.goalLanguage
            )
          }
        }
      }
    }
    ))
  }))

  return object
}

async function translateWithFallback (text, options) {
  let translatedText = ''
  let retries = 0
  let waitingTime = 5000
  while (retries < maxRetries) {
    translatedText = await translateText(text, options)
    if (translatedText !== 'Enter your translation here') {
      return translatedText
    }
    retries += 1
    // wait for a while before trying again
    await delay(waitingTime)
    console.log(options.prefix + 'Retry translation')
    waitingTime *= 2
  }
  return translatedText
}

function delay (time) {
  return new Promise(resolve => setTimeout(resolve, time))
}

async function translateText (text, options) {
  counterCalls += 1
  const translatedText = await fetch(
    endpoint + '/translate?api-version=3.0&to=' + options.goalLanguage + '&from=' + options.mainLanguage + '&textType=html',
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
      // Check if there is an error thrown by Azure Translator
      if (data.error !== undefined) {
        console.error('An error occured while translating text, thrown by Azure Translator')
        console.error('error', data.error.message)
        return 'Enter your translation here'
      }
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

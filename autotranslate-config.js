const { program } = require('commander')
const fs = require('node:fs')

const endpoint = 'https://api.cognitive.microsofttranslator.com/'
const possibleLanguages = ['de', 'en', 'fr', 'nl']

program
  .usage(
    'node autotranslate-config.js creates a translation of a config file'
  )
  .requiredOption('-i, --input <path>', 'input file to translate (a json file)')
  .requiredOption('-o, --output <path>', 'output file to write the translated config to (a json file)')
  .requiredOption(
    '-g, --goalLanguage <languagecodes separated by a comma>',
    'the languages that shall be translated to (a languagecode)'
  )
  .requiredOption(
    '-m, --mainLanguage <languagecode>',
    'the language that shall be translated from (a languagecode)'
  )
  .requiredOption(
    '-s, --subscriptionKey <key-string>',
    'Subscription key for Azure AI Translator (a String)'
  )
  .on('--help', function () {
    console.log('Examples:')
    console.log(
      '  $ node autotranslate-config.js -i <input> -g <languagecodes> -m <languagecode> -s <key-string>'
    )
  })

program.parse(process.argv)
const options = program.opts()

updateConfig(options)

function updateConfig (options) {
  console.log('start updating config file')
  const jsonObject = readJson(options.input)
  translateJson(jsonObject, options).then((translatedJsonObject) => {
    writeJson(options.output, translatedJsonObject)
  })
}

async function translateJson (jsonObject, options) {
  console.log('start translating')
  // Loop over json object and translate certain values
  for (const key in jsonObject) {
    if (typeof jsonObject[key] === 'string' && key !== 'descriptionFileName' && key !== 'repository' && !(key.toLowerCase().includes('date'))) {
      // Case 1: No translation has been done yet for strings
      jsonObject[key] = await translateAllLanguages(jsonObject[key], options)
    } else if (typeof jsonObject[key] === 'object' && possibleLanguages.some((language) => language in jsonObject[key])) {
      // Case 2: Translates the same values as case 1 but now there is already a translation
      jsonObject[key] = await translateMissingLanguages(jsonObject[key], options)
    } else if (Array.isArray(jsonObject[key])) {
      // Case 3: Translates all elements in an array
      for (const element of jsonObject[key]) {
        element.name = await checkAndTranslate(element.name, options)
      }
    } else if (typeof jsonObject[key] === 'object' && 'name' in jsonObject[key]) {
      // Case 4: Translates the name of an object
      jsonObject[key].name = await checkAndTranslate(jsonObject[key].name, options)
    }
  }
  return jsonObject
}

// Function to check if a translation has been done already and if not, translate it
async function checkAndTranslate (object, options) {
  let translatedJsonObject = {}
  if (typeof object === 'string') {
    translatedJsonObject = await translateAllLanguages(object, options)
  } else if (typeof object === 'object' && possibleLanguages.some((language) => language in object)) {
    translatedJsonObject = await translateMissingLanguages(object, options)
  }
  return translatedJsonObject
}

// Function to translate all languages (used when no translation has been done yet)
async function translateAllLanguages (object, options) {
  const translatedJsonObject = {}
  translatedJsonObject[options.mainLanguage] = object
  for (const goalLanguage of options.goalLanguage.split(',')) {
    translatedJsonObject[goalLanguage] = await translateText(object, options.mainLanguage, goalLanguage, options.subscriptionKey)
  }
  return translatedJsonObject
}

// Function to translate missing languages (used when a translation has been done already)
async function translateMissingLanguages (object, options) {
  let translatedJsonObject = {}
  translatedJsonObject = object
  for (const language of options.goalLanguage.split(',')) {
    if (!(language in object)) {
      translatedJsonObject[language] = await translateText(object[options.mainLanguage], options.mainLanguage, language, options.subscriptionKey)
    }
  }
  return translatedJsonObject
}

async function translateText (text, mainLanguage, goalLanguage, subscriptionKey) {
  const translatedText = await fetch(
    endpoint + '/translate?api-version=3.0&to=' + goalLanguage + '&from=' + mainLanguage,
    {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': subscriptionKey,
        'Ocp-Apim-Subscription-Region': 'westeurope',
        'Content-type': 'application/json'
      },
      body: JSON.stringify([{ text: text }])
    }
  )
    .then((response) => response.json())
    .then((data) => {
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

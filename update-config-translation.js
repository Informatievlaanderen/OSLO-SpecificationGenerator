const { program } = require('commander')
const fs = require('node:fs')

const endpoint = 'https://api.cognitive.microsofttranslator.com/'

program
  .usage(
    'node update-config-translation.js updates the config file with the translation of the values'
  )
  .requiredOption('-i, --input <path>', 'input file to translate (a jsonld file)')
  .requiredOption('-o, --output <path>', 'output file')
  .requiredOption(
    '-g, --goalLanguage <languagecode>',
    'the language that shall be translated to (a languagecode)'
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
      '  $ node update-config-translation.js -i <input> -g <languagecode> -m <languagecode> -s <key-string>'
    )
  })

program.parse(process.argv)
const options = program.opts()

updateConfigTranslation(options)

function updateConfigTranslation (options) {
  console.log('start adding translation block to config file')
  const jsonObject = readJson(options.input)
  addTranslationBlock(jsonObject, options).then((updatedJsonObject) => {
    writeJson(options.output, [updatedJsonObject])
  })
}

async function addTranslationBlock (jsonObject, options) {
  // Check if translation block exists
  if (!jsonObject.translation) {
    jsonObject.translation = []
  }
  // Check if translation for primary language exists
  if (!jsonObject.translation.find((element) => element.language === options.mainLanguage)) {
    const mainLanguageTranslation = {}
    mainLanguageTranslation.language = options.mainLanguage
    mainLanguageTranslation.template = jsonObject.template
    mainLanguageTranslation.title = jsonObject.title
    mainLanguageTranslation.translationjson = jsonObject.name + '_' + options.mainLanguage + '.json'
    mainLanguageTranslation.mergefile = 'merge_' + jsonObject.name + '_' + options.mainLanguage + '.jsonld'
    mainLanguageTranslation.autotranslate = false
    jsonObject.translation.push(mainLanguageTranslation)
  }
  // Check if translation for goal language exists
  if (!jsonObject.translation.find((element) => element.language === options.goalLanguage)) {
    // Get block of main language
    const mainLanguageTranslation = jsonObject.translation.find((element) => element.language === options.mainLanguage)
    const goalLanguageTranslation = {}
    goalLanguageTranslation.language = options.goalLanguage
    goalLanguageTranslation.template = updateValue(mainLanguageTranslation.template, options)
    goalLanguageTranslation.title = await translateTitle(mainLanguageTranslation.title, options)
    goalLanguageTranslation.translationjson = updateValue(mainLanguageTranslation.translationjson, options)
    goalLanguageTranslation.mergefile = updateValue(mainLanguageTranslation.mergefile, options)
    goalLanguageTranslation.autotranslate = true
    jsonObject.translation.push(goalLanguageTranslation)
  }
  return jsonObject
}

function updateValue (value, options) {
  // Check if a possible language code is in value
  if (value.includes('_' + options.mainLanguage)) {
    return value.replace('_' + options.mainLanguage, '_' + options.goalLanguage)
  } else {
    const parts = value.split('.')
    const extension = parts.pop()
    const filename = parts.join('.')
    return filename + '_' + options.goalLanguage + '.' + extension
  }
}

async function translateTitle (text, options) {
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
      return ''
    }
    )
  return translatedText
}

function readJson (filename) {
  console.log('start reading file ' + filename)
  try {
    const jsonFile = fs.readFileSync(filename, 'utf-8')
    const jsonObject = JSON.parse(jsonFile)
    // Check if array
    if (jsonObject.constructor === Array) {
      return jsonObject[0]
    }
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

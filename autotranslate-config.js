const { program } = require('commander')
const fs = require('node:fs')

const endpoint = 'https://api.cognitive.microsofttranslator.com/'

program
  .usage(
    'node autotranslate-config.js creates a translation of a config file'
  )
  .requiredOption('-i, --input <path>', 'input file to translate (a json file)')
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
    writeJson(options.input, translatedJsonObject)
  })
}

async function translateJson (jsonObject, options) {
  console.log('start translating')
  // Loop over json object and translate certain values
  for (const key in jsonObject) {
    if (typeof jsonObject[key] === 'string' && key !== 'descriptionFileName') {
      const translatedJsonObject = {}
      translatedJsonObject[options.mainLanguage] = jsonObject[key]
      // for all goal languages
      for (const goalLanguage of options.goalLanguage.split(',')) {
        translatedJsonObject[goalLanguage] = await translateText(jsonObject[key], options.mainLanguage, goalLanguage, options.subscriptionKey)
      }
      jsonObject[key] = translatedJsonObject
    } else if (Array.isArray(jsonObject[key])) {
      for (const element of jsonObject[key]) {
        const translatedJsonObject = {}
        translatedJsonObject[options.mainLanguage] = element.name
        // for all goal languages
        for (const goalLanguage of options.goalLanguage.split(',')) {
          translatedJsonObject[goalLanguage] = await translateText(element.name, options.mainLanguage, goalLanguage, options.subscriptionKey)
        }
        element.name = translatedJsonObject
      }
    }
    if (typeof jsonObject[key] === 'object' && 'name' in jsonObject[key]) {
      const translatedJsonObject = {}
      translatedJsonObject[options.mainLanguage] = jsonObject[key].name
      // for all goal languages
      for (const goalLanguage of options.goalLanguage.split(',')) {
        translatedJsonObject[goalLanguage] = await translateText(jsonObject[key].name, options.mainLanguage, goalLanguage, options.subscriptionKey)
      }
      jsonObject[key].name = translatedJsonObject
    }
  }
  return jsonObject
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

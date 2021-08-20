const fs = require('fs')
const program = require('commander')

program
  .version('0.8.0')
  .usage('pretty-print a json-ld context')
  .option('-i, --input <path>', 'input file (a jsonld file)')
  .option('-o, --output <path>', 'output file (the context)')
  .option('-s, --sortkeys [keys...]', 'keys to sort on', ['authors', 'editors', 'contributors'])
  .option('-a, --sortAttributes [attributes...]', 'attributes to sort on. Use prefixes to set sorting order per attribute as asc: or desc: ', ['foaf:lastName', 'foaf:FirstName'])
  .option('--descending', 'set global sorting order to descending (ascending default)', false)

program.on('--help', function () {
  console.log('')
  console.log('Examples:')
  console.log('  $ pretty-print --help')
  console.log('  $ pretty-print -i <input> -o <output>')
})

program.parse(process.argv)
const options = program.opts()

// Import Json-LD file and parse it + select the authors part from that file
const dataFile = fs.readFileSync(options.input)
let parsedData = JSON.parse(dataFile)

// Create objects from these arguments and put them in the attributes array
const attributes = []

for (const index in options.sortAttributes) {
  let ascending = options.descending
  let element = options.sortAttributes[index]
  if (element.startsWith('asc:')) {
    ascending = true
    element = element.substring(4, element.length)
  }
  if (element.startsWith('desc:')) {
    ascending = false
    element = element.substring(5, element.length)
  }

  //   console.log(element)
  //   console.log(ascending)
  attributes.push({ ascending: ascending, attribute: element })
}

// Sort on the attributes
const sortOnAttributes = function (a, b) {
//   console.log(attributes)
  for (let index = 0; index < attributes.length; index++) {
    const element = attributes[index]
    //     console.log(element)
    if (element.ascending) {
      if (a[element.attribute] < b[element.attribute]) { return -1 }
      if (a[element.attribute] > b[element.attribute]) { return 1 }
    } else {
      if (a[element.attribute] < b[element.attribute]) { return 1 }
      if (a[element.attribute] > b[element.attribute]) { return -1 }
    }
  }

  return 0
}

// sorts a certain key within a hash with the given function
const sortOnKey = function (hash, key, sortFunction) {
  const arrayToSort = hash[key]
  //   console.log(arrayToSort)
  hash[key] = arrayToSort.sort(sortFunction)
  //   console.log(hash[key])
  return hash
}

// loops through the keys in the keyToSort array and apply the sortOnAttributes function
for (const key in options.sortkeys) {
//   console.log(options.sortkeys[key])
  parsedData = sortOnKey(parsedData, options.sortkeys[key], sortOnAttributes)
}

// Output and write to file
fs.writeFileSync(options.output, JSON.stringify(parsedData, null, 4))

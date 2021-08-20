const fs = require('fs')
const jsonfile = require('jsonfile')
const nunjucks = require('nunjucks')

const program = require('commander')

program
  .version('1.0.0')
  .usage('node fill-example-templates.js creates jsonld files per class')
  .option('-d, --directory <directory>', 'directory where you saved your example templates (not the context!)')
  .option('-o, --outputdirectory <directory>', 'outputdirectory to save the new files to. If it is the same as the directory, the files in there will be overwritten.')

program.on('--help', function () {
  console.log('')
  console.log('Examples:')
  console.log('  $ fill-example-templates --help')
  console.log('  $ fill-example-templates -i <input> -o <output>')
})

program.parse(process.argv)
const options = program.opts()

const directory = options.directory || '/exampletemplates/'
nunjucks.configure(directory, {
  autoescape: true
})

render_exampletemplate_from_json_ld_file(options.directory, options.outputdirectory)
console.log('done')

function render_exampletemplate_from_json_ld_file (directory, outputdirectory) {
  console.log('start reading')
  fs.readdir(directory, (err, files) => {
    files.forEach(file => {
      const path = directory + '\\' + file
      if (fs.lstatSync(path).isDirectory()) {
        render_exampletemplate_from_json_ld_file(path, outputdirectory + '\\' + file)
      } else {
        handleFile(path, outputdirectory, file)
      }
    })
  })
}

function handleFile (input, outputdirectory, file) {
  jsonfile.readFile(input)
    .then(
      function (json) {
        json = iterate_over_json(json)
        const output = getOutputFile(outputdirectory, file)

        if (!fs.existsSync(outputdirectory)) {
          fs.mkdirSync(outputdirectory)
        }

        jsonfile.writeFile(output, json)
          .then(res => {
            console.log('Write complete to: ' + output)
          })
          .catch(error => { console.error(error); process.exitCode = 1 })
      })
    .catch(error => { console.error(error); process.exitCode = 1 })
}

function getOutputFile (dir, file) {
  if (dir.charAt(dir.length - 1) === '\\' || dir.charAt(dir.length - 1) === '/') {
    return dir + file
  } else if (dir.includes('/') && dir.charAt(dir.length - 1) !== '/') {
    return dir + '/' + file
  } else {
    return dir + '\\' + file
  }
}

function iterate_over_json (json) {
  for (const key in json) {
    if (!(json[key] === undefined) && json[key] != null && typeof json[key] !== 'object') {
      json = write_value(json, key)
    }
    if (!(json[key] === undefined) && typeof json[key] === 'object') {
      iterate_over_json(json[key])
    }
  }
  return json
}

function write_value (json, key) {
  let value = json[key]
  switch (value) {
    case '{{STRING}}':
      value = generate_string(25)
      break
    case '{{VAL}}':
      value = generate_string(10)
      break
    case '{{ANYURI}}':
    case '{{ID}}':
      value = generate_uri()
      break
    case '{{DATETIME}}':
      value = generate_date()
      break
    default:
      if (value.includes('{{')) {
        console.log(value)
        value = generate_string(10)
      }
      break
  }
  json[key] = value
  return json
}

function generate_string (length) {
  let result = ''
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz '
  const charactersLength = characters.length
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength))
  }
  return result
}

function generate_value (length) {
  let result = ''
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz123456789'
  const charactersLength = characters.length
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength))
  }
  return result
}

function getRandomIntInclusive (min, max) {
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function generate_date () {
  const start = new Date(getRandomIntInclusive(2000, 2019), getRandomIntInclusive(1, 12), getRandomIntInclusive(1, 28))
  const end = new Date()
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}

function generate_uri () {
  return 'http://' + generate_value(8) + '/' + generate_value(14) + '/' + generate_value(10) + '#'
}

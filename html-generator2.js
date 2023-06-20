const fs = require('fs')
const jsonfile = require('jsonfile')
const nunjucks = require('nunjucks')
const ldParser = require('./linkeddataparser3')

const program = require('commander')

program
  .version('1.0.0')
  .usage('node html-generator2.js creates html pages for jsonld files with regard to a chosen language')
  .option('-s, --style <target>', 'target style html forms. One of {voc,ap, oj}', /^(voc|ap|oj|all)$/i)
  .option('-t, --template <template>', 'html template to render')
  .option('-d, --templatedir [directory]', 'the directory containing all templates')
  .option('-f, --forceskos', 'force the range skos:Concept for enumerated properties, default false')
  .option('-h, --hostname <hostname>', 'the public hostname/domain on which the html is published. The hostname in the input file takes precedence.')
  .option('-r, --documentpath <path>', 'the document path on which the html is published')
  .option('-x, --debug <path>', 'the intermediate json which will be used by the templaterenderer')
  .option('-m, --mainlanguage <languagecode>', 'the language to display(a languagecode string)')
  .option('-u, --uridomain <uridomain>', 'the domain of the URIs that should be excluded from this vocabulary')
  .option('-i, --input <path>', 'input file that is merged from the jsonld and its appropriate translation json (a jsonld file)')
  .option('-o, --output <path>', 'output file (the html file)')
  .option('-e, --tempdir [directory]', 'the directory for intermediate processing')

program.on('--help', function () {
  console.log('')
  console.log('Examples:')
  console.log('  $ html-generator2 --help')
  console.log('  $ html-generator2 -s <target> -t <template> -m <mainlanguage> -d <template directory> -i <input> -o <output>')
})

program.parse(process.argv)
const options = program.opts()

let templatedir = options.templatedir || '/app/views' // default path when using docker build
templatedir = options.templatedir || './views/' // default path when using local build
nunjucks.configure(templatedir, {
  autoescape: true
})

render_html_from_json_ld_file(options.style, options.template, options.input, options.output, options.mainlanguage)

console.log('done')

function render_html_from_json_ld_file (target, template, filename, output_filename, language) {
  console.log('start reading')
  jsonfile.readFile(filename)
    .then(
      function (obj) {
        console.log('start processing')
        let promise = {}
        const hostname = options.hostname
        const forceskos = !!options.forceskos
        switch (target) {
          case 'voc':
            promise = ldParser.parse_ontology_from_json_ld_file_voc(filename, hostname, language)
            break
          case 'ap':
            promise = ldParser.parse_ontology_from_json_ld_file_all(filename, hostname, forceskos, language)
            break
          case 'oj':
            promise = ldParser.parse_ontology_from_json_ld_file_oj(filename, hostname, forceskos, language)
            break
          default:
            console.log('unknown or not provided target for the html rendering')
        };

        promise.then(function (parsed_json) {
          parsed_json.documentroot = options.documentpath
          if (options.debug) {
            jsonfile.writeFile(options.debug, parsed_json, function (err) {
              if (err) {
                process.exitCode = 1
                console.error(err)
                throw err
              }
            })
          };
          parsed_json.namespaces = getNamespaces(obj)
          const html = nunjucks.render(template, parsed_json)

          const data = new Uint8Array(Buffer.from(html))

          console.log('start writing')
          fs.writeFile(output_filename, data, (err) => {
            if (err) {
              process.exitCode = 1
              throw err
            }
            console.log('The file has been saved to ' + output_filename)
          })
        }).catch(error => { console.error(error); process.exitCode = 1 })
      })
    .catch(error => { console.error(error); process.exitCode = 1 })
}

function getNamespaces (myJson) {
  console.log('Checking Namespaces')
  let namespaces = []

  for (let i = 0; i < myJson.classes.length; i++) {
    const currClass = myJson.classes[i]
    namespaces = pushNampespace(currClass['@id'], namespaces)
    for (let p = 0; p < currClass.parents; p++) {
      namespaces = pushNampespace(currClass.parents[p], namespaces)
    }
  }

  for (let j = 0; j < myJson.properties.length; j++) {
    const currProperty = myJson.properties[j]
    namespaces = pushNampespace(currProperty['@id'], namespaces)
    for (let r = 0; r < currProperty.range; r++) {
      namespaces = pushNampespace(currProperty.range[r], namespaces)
    }
    for (let d = 0; d < currProperty.domain; d++) {
      namespaces = pushNampespace(currProperty.domain[d], namespaces)
    }
  }

  namespaces = pushNampespace(myJson['@id'], namespaces)
  console.log('Finished')
  return namespaces
}

function pushNampespace (uri, namespaces) {
  if (!(uri === undefined) && uri !== null && uri !== '') {
    const lastIndex = uri.lastIndexOf('/')
    const lastPart = uri.substring(lastIndex)
    if (!lastPart.includes('#') && (uri.substring(0, lastIndex).length > 7)) {
      namespaces = push(namespaces, uri.substring(0, lastIndex))
    } else if (!lastPart.includes('#') && (uri.substring(0, lastIndex).length <= 7)) {
      namespaces = push(namespaces, uri)
    } else {
      const lastHash = uri.lastIndexOf('#')
      namespaces = push(namespaces, uri.substring(0, lastHash))
    }
  }
  return namespaces
}

function push (namespaces, value) {
  if (!namespaces.includes(value)) {
    namespaces.push(value)
  }
  return namespaces
}

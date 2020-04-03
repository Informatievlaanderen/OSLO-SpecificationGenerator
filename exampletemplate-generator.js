const fs = require('fs')
const jsonfile = require('jsonfile')
const jsonld = require('jsonld')
const nunjucks = require('nunjucks')
const ldParser = require('./linkeddataparser2')
const camelCase = require('camelcase')
const papaparse = require('papaparse')

var program = require('commander')

program
  .version('0.8.0')
  .usage('node exampletemplate-generator.js creates jsonld files per class')
  .option('-t, --template <template>', 'html template to render')
  .option('-h, --contextbase <hostname>', 'the public base url on which the context of the jsons are published.')
  .option('-r, --documentpath <path>', 'the document path on which the jsons are is published')
  .option('-x, --debug <path>', 'dump the intermediate json which will be used by the templaterenderer')
  .option('-i, --input <path>', 'input file (a jsonld file)')
  .option('-o, --output [directory]', 'output directory for the json files')

program.on('--help', function () {
  console.log('')
  console.log('Examples:')
  console.log('  $ exampletemplate-generator --help')
  console.log('  $ exampletemplate-generator -i <input> -o <output>')
})

program.parse(process.argv)

var output = program.output || '/exampletemplates/'
nunjucks.configure(output, {
  autoescape: true
})

render_exampletemplate_from_json_ld_file(program.input, program.output)
console.log('done')

function render_exampletemplate_from_json_ld_file (filename, outputdirectory) {
  console.log('start reading')
  jsonfile.readFile(filename)
    .then(
      function (obj) {
        console.log('start processing')
        var promise = {}
        var hostname = program.hostname
        promise = ldParser.parse_json_ld_file_to_exampletemplates(filename, hostname)

        promise.then(function (parsed_json) {
          parsed_json.documentroot = program.documentpath
          if (program.debug) {
            jsonfile.writeFile(program.debug, parsed_json, function (err) {
              if (err) {
                process.exitCode = 1
                console.error(err)
                throw err
              }
            })
          };

          console.log('start writing class templates')
          let classes = parsed_json.classes
          let filenamei = ''
          for (const i in classes) {
            filenamei = outputdirectory + '/' + camelCase(classes[i].name.nl) + '.json'
            jsonfile.writeFile(filenamei, make_exampletemplate(classes[i]), function (err) {
              if (err) {
                // Set the exit code if there's a problem so bash sees it
                process.exitCode = 1
                console.error(err)
                throw err
              }
            })
          }
          console.log('start writing datatype templates')
          classes = parsed_json.datatypes
          for (const i in classes) {
            filenamei = outputdirectory + '/' + camelCase(classes[i].name.nl) + '.json'
            jsonfile.writeFile(filenamei, make_exampletemplate(classes[i]), function (err) {
              if (err) {
                // Set the exit code if there's a problem so bash sees it
                process.exitCode = 1
                console.error(err)
                throw err
              }
            })
          }

          console.log('start writing class & datatype contextfiles')
          classes = parsed_json.classes.concat(parsed_json.datatypes)
          for (const i in classes) {
            filenamei = outputdirectory + '/context/' + camelCase(classes[i].name.nl) + '.jsonld'
            jsonfile.writeFile(filenamei, make_exampletemplate_context(classes[i]), function (err) {
              if (err) {
                // Set the exit code if there's a problem so bash sees it
                process.exitCode = 1
                console.error(err)
                throw err
              }
            })
          }
          console.log('The files have been saved to ' + outputdirectory)
        })
      })
    .catch(error => { console.error(error); process.exitCode = 1 })
}

function make_exampletemplate (cj_class_desc) {
  var cj_class = {
    '@context': program.contextbase + '/' + camelCase(cj_class_desc.name.nl) + '.jsonld',
    '@type': cj_class_desc.uri,
    '@id': '{{ID}}'
  }
  for (const p in cj_class_desc.properties) {
    var rp = range_repr(cj_class_desc.properties[p].scopedrange)
    // console.log(cj_class_desc.properties[p]);
    // console.log(cj_class_desc.properties[p].name);
    // console.log(cj_class_desc.properties[p].name.nl);
    if ((cj_class_desc.properties[p].name.nl !== null) && (cj_class_desc.properties[p].name.nl !== '')) {
      cj_class[camelCase(cj_class_desc.properties[p].name.nl)] = rp
    }
  }

  var pt = parse_template(JSON.stringify(cj_class))
  var ren = render_template(pt, { ID: 'een identifier', STRING: 'een string waarde', BOOLEAN: 'true', VAL: 'I do not know' })
  // console.log(ren);
  return cj_class
}

function make_exampletemplate_context (cj_class_desc) {
  var cj_class_context = {}
  cj_class_context[camelCase(cj_class_desc.name.nl)] = cj_class_desc.uri

  for (const p in cj_class_desc.properties) {
    var rp = range_repr_context(cj_class_desc.properties[p].uri, cj_class_desc.properties[p].scopedrange)
    if ((cj_class_desc.properties[p].name.nl != null) && (cj_class_desc.properties[p].name.nl !== '')) {
      cj_class_context[camelCase(cj_class_desc.properties[p].name.nl)] = rp
    };
  }
  return cj_class_context
}

function range_repr (prop_range) {
  var pru = ''
  if ((prop_range[0] != null) && (prop_range[0].range_puri != null)) {
    pru = prop_range[0].range_puri
    if (pru === 'http://www.w3.org/1999/02/22-rdf-syntax-ns#langString') {
      return { nl: '{{STRING}}' }
    };

    var pr_represention = '{{VAL}}'
    if (pru.startsWith('http://www.w3.org/2001/XMLSchema#')) {
      pr_represention = '{{' + pru.substring(33, pru.length).toUpperCase() + '}}'
    }
    return pr_represention
  } else {
    return '{{ANY}}'
  };
};

function range_repr_context (prop, prop_range) {
  if ((prop_range[0] != null) && (prop_range[0].range_puri != null)) {
    var pru = prop_range[0].range_puri
    if (pru === 'http://www.w3.org/1999/02/22-rdf-syntax-ns#langString') {
      return {
        '@container': ['@language', '@set'],
        '@id': prop,
        '@type': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#langString'
      }
    };

    if (pru.startsWith('http://www.w3.org/2001/XMLSchema#')) {
      return {
        '@id': prop,
        '@type': pru
      }
    };

    return prop
  } else {
    return ''
  };
};

function parse_template (file) {
  var parsed_template = {
    pt_full: [],
    pt_vars: []
  }

  var file1 = file.split('{{')
  var file2 = []
  for (const i in file1) {
    file2 = file2.concat(file1[i].split('}}'))
  };
  parsed_template.pt_full = file2

  return parsed_template
}

function render_template (parsed_template, data) {
  let render = ''
  for (const i in parsed_template.pt_full) {
    const reminder = i % 2
    if (reminder === 0) {
      render = render + parsed_template.pt_full[i]
    } else {
      render = render + data[parsed_template.pt_full[i]]
    }
  }
  return render
}

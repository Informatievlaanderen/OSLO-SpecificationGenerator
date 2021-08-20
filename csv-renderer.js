const fs = require('fs')
const papaparse = require('papaparse')

const program = require('commander')

program
  .version('1.0.0')
  .usage('node csv-renderer.js renders the content of a CSV file into a jsonld template')
  .option('-t, --template <template>', 'jsonld template to render')
  .option('-h, --contextbase <hostname>', 'the public base url on which the context of the jsons are published.')
  .option('-r, --documentpath <path>', 'the document path on which the jsons are is published')
  .option('-x, --debug <path>', 'dump the intermediate json which will be used by the templaterenderer')
  .option('-i, --input <path>', 'input file (a csv file)')
  .option('-o, --output <path>', 'output file (a json file)')

program.on('--help', function () {
  console.log('')
  console.log('Examples:')
  console.log('  $ csv-renderer --help')
  console.log('  $ csv-renderer -i <input> -o <output>')
})

program.parse(process.argv)
const options = program.opts()

const output = options.output || 'output.json'
const csvoptions = {
  header: true,
  skipEmptyLines: true,
  complete: function (results) {
    console.log('Finished:')
  }
}

render_csv(options.template, options.input, output)
console.log('done')

function render_csv (templatefile, csvfilename, output) {
  console.log('start reading')
  const template = fs.readFileSync(templatefile, 'utf-8')
  const csvf = fs.readFileSync(csvfilename, 'utf-8')
  const csv = papaparse.parse(csvf, csvoptions)

  const pt = parse_template(template)
  const ren = render_template(pt, csv.data)

  const writeStream = fs.createWriteStream(output)

  write_data(writeStream, ren)
  writeStream.on('finish', () => {
    console.log('wrote all data to file')
  })

  // close the stream
  writeStream.end()

  console.log('finished rendering to ' + output)
};

function parse_template (file) {
  const parsed_template = {
    pt_full: [],
    pt_vars: []
  }

  const file1 = file.split('{{')
  let file2 = []
  for (let i in file1) {
    file2 = file2.concat(file1[i].split('}}'))
  };
  parsed_template.pt_full = file2

  return parsed_template
}

function render_template (parsed_template, data) {
  const renderedData = []
  for (let i in data) {
    renderedData[i] = render_template_single(parsed_template, data[i])
  }
  return renderedData
};

function render_template_single (parsed_template, data) {
  let render = ''
  for (let i in parsed_template.pt_full) {
    const reminder = i % 2
    if (reminder === 0) {
      render = render + parsed_template.pt_full[i]
    } else {
      render = render + data[parsed_template.pt_full[i]]
    }
  }
  return render
}

function write_data (stream, data) {
  stream.write('[')
  for (let i in data) {
    stream.write(data[i])
    stream.write(',')
  }
  stream.write(']')
  return true
};

const fs = require('fs')
const jsonfile = require('jsonfile')
const nunjucks = require('nunjucks')
const ldParser = require('./linkeddataparser3')

const program = require('commander')

program
  .version('1.0.0')
  .usage('node html-metadata-generator.js extracts metadata for the html pages in  a chosen language')
  .option('-h, --hostname <hostname>', 'the public hostname/domain on which the html is published. The hostname in the input file takes precedence.')
  .option('-r, --documentpath <path>', 'the document path on which the html is published')
  .option('-m, --mainlanguage <languagecode>', 'the language to display(a languagecode string)')
  .option('-u, --uridomain <uridomain>', 'the domain of the URIs that should be excluded from this vocabulary')
  .option('-i, --input <path>', 'input file')
  .option('-o, --output <path>', 'output file (the metadat file)')

program.on('--help', function () {
  console.log('')
  console.log('Examples:')
  console.log('  $ html-metadata-generator --help')
  console.log('  $ html-metadata-generator -m <mainlanguage> -i <input> -o <output>')
})

program.parse(process.argv)
const options = program.opts()

render_metadata(options.input, options.output, options.mainlanguage)

console.log('done')

function render_metadata (input_filename, output_filename, language) {
  console.log('start reading')
  jsonfile.readFile(input_filename)
    .then(
      function (input) {
        console.log('start processing')
        const hostname = options.hostname
	let output = make_nj_metadata(input, hostname, language)

        console.log('start writing')
            jsonfile.writeFile(output_filename, output, function (err) {
              if (err) {
                process.exitCode = 1
                console.error(err)
                throw err
              }
              console.log('The file has been saved to ' + output_filename)
            })

      })
    .catch(error => { console.error(error); process.exitCode = 1 })
}





function getNamespaces (data) {
  console.log('Checking Namespaces')
  let namespaces = []

  let classes = data.classes
  let attributes = data.attributes
  let datatypes = data.datatypes
  let referencedEntities = data.referencedEntities

  namespaces = classes.reduce(function (acc, elem) {
	  acc = pushNamespace(elem.assignedURI, acc)
	  return acc
  }, namespaces)
  namespaces = attributes.reduce(function (acc, elem) {
	  acc = pushNamespace(elem.assignedURI, acc)
	  return acc
  }, namespaces)
  namespaces = datatypes.reduce(function (acc, elem) {
	  acc = pushNamespace(elem.assignedURI, acc)
	  return acc
  }, namespaces)
  namespaces = referencedEntities.reduce(function (acc, elem) {
	  acc = pushNamespace(elem.assignedURI, acc)
	  return acc
  }, namespaces)

  console.log('Finished')
  return namespaces
}

function pushNamespace (uri, namespaces) {
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

//-----------------------------------------------------------------------//
//
// extract metadata from expanded json
// Takes an expanded json root object as it is being parsed by jsonld
// together with the context such as it is being defined in the root of
// this repository and returns the metadata for the ontology that is
// encoded within the json ld.
// It in the form that the nunjucks template expects it.
// For an example please refer to the README.md.
//
// @param expanded the root class as it is being read by jsonld

function make_nj_metadata (json, hostname, language) {
  let hn = json.hostname
  if (hn == null) {
    hn = (hostname != null) ? hostname : 'https://data.vlaanderen.be'
  }
  if (json.navigation) {
    json.navigation.self = hn + json.urlref
  } else {
    console.log('Warning: no navigation defined for this rendering')
    json.navigation = {
      self: hn + json.urlref
    }
  }

  const docstatus = json['publication-state']
  let docstatuslabel = ''

  switch (docstatus) {
    case 'https://data.vlaanderen.be/id/concept/StandaardStatus/Kandidaat-standaard':
      docstatuslabel = 'Kandidaat-standaard'
      break
    case 'https://data.vlaanderen.be/id/concept/StandaardStatus/Standaard':
      docstatuslabel = 'Standaard'
      break
    case 'https://data.vlaanderen.be/id/concept/StandaardStatus/HerroepenStandaard':
      docstatuslabel = 'Herroepen Standaard'
      break
    case 'https://data.vlaanderen.be/id/concept/StandaardStatus/OntwerpdocumentInOntwikkeling':
      docstatuslabel = 'Ontwerpdocument'
      break
    case 'https://data.vlaanderen.be/id/concept/StandaardStatus/ErkendeStandaard':
      docstatuslabel = 'Erkende Standaard'
      break
    case 'https://data.vlaanderen.be/id/concept/StandaardStatus/OntwerpStandaard':
      docstatuslabel = 'Ontwerp Standaard'
      break
    case 'https://data.vlaanderen.be/id/concept/StandaardStatus/KandidaatStandaard':
      docstatuslabel = 'Kandidaat Standaard'
      break
    case 'https://data.vlaanderen.be/id/concept/StandaardStatus/NotaWerkgroep':
      docstatuslabel = 'Nota Werkgroep'
      break
    default:
      docstatuslabel = 'Onbekend'
  };
  if (!json.license || json.license === '') {
    // set default value
    json.license = 'https://data.vlaanderen.be/id/licentie/modellicentie-gratis-hergebruik/v1.0'
  }

  let documentconfig = {}	
  if (!json.documentconfig || json.documentconfig === '') {
    // set default value
    documentconfig = {}
  } else {
    documentconfig = json.documentconfig
  }

  let titel = ""
  if (json.translation) {
	for (i in json.translation ) {
	     if (json.translation[i].language === language) {
		 titel = json.translation[i].title
	     }
	}
	if (titel === "") {
		titel = json.title
	} 
  }
  else  {
	  titel = json.title
  }

  let usednamespaces = getNamespaces(json)

  const meta = {
    title: titel,
    uri: json['@id'],
    issued: json['publication-date'],
    baseURI: json.baseURI,
    baseURIabbrev: json.baseURIabbrev,
    filename: json.name,
    navigation: json.navigation,
    license: json.license,
    documenttype: json.type,
    documentconfig: documentconfig,	  
    status: docstatus,
    statuslabel: docstatuslabel,
    repositoryurl: json.repository + '/tree/' + json.documentcommit,
    changelogurl: json.repository + '/blob/' + json.documentcommit + '/CHANGELOG',
    feedbackurl: json.feedbackurl,
    standaardregisterurl: json.standaardregisterurl,
    dependencies: json.dependencies,
    usesVocs: [],
    usesAPs: [],
    namespaces : usednamespaces
  }
  return meta
};
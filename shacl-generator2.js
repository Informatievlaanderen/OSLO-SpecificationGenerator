const jsonfile = require('jsonfile')
const SHA1 = require('crypto-js/sha1')
const program = require('commander')

program
  .version('1.0.0')
  .usage('node shacl-generator2.js creates shacl template with regards to a langauge')
  .option('-i, --input <path>', 'input file (a jsonld file)')
  .option('-o, --output <path>', 'output file (shacl)')
  .option('-d, --domain <path>', 'domain of the shacl shapes, without #')
  .option('-l, --language <languagecode>', 'the language for the shacl')
  .option('-m, --mode <mode>', 'the generation mode of the shacl shape. One of {grouped,individual}', /^(grouped|individual)$/i)

program.on('--help', function () {
  console.log('')
  console.log('Examples:')
  console.log('  $ shacl-generator2 --help')
  console.log('  $ shacl-generator2 -i <input> -o <output> -d <domain> -l <languageCode>')
  process.exitCode = 1
})

program.parse(process.argv)
const options = program.opts()
render_shacl_from_json_ld_file(options.input, options.output, options.language)
console.log('done')

/*
 *
 * shacl
 * template = NodeShape(targetclass, property, closed)
 */

function render_shacl_from_json_ld_file (filename, output_filename, language) {
  console.log('start reading')
  console.log(filename)
  console.log(output_filename)
  console.log(language)
  jsonfile.readFile(filename)
    .then(
      function (obj) {
        console.log('start processing')

        const grouped = group_properties_per_class(obj)
        const entitymap = entity_map(obj)
        const shacl = make_shacl(options.mode, grouped, entitymap, language)

        console.log('start writing')

        jsonfile.writeFile(output_filename, shacl)
          .then(res => {
            console.log('Write complete, file saved to: ' + output_filename)
          })
          .catch(error => {
            console.error(error)
            process.exitCode = 1
          })
      }
    )
    .catch(error => console.error(error))
}

/*
 * group the properties per class using the domain
 */
function group_properties_per_class (json) {
  let classes = json.classes
  classes = classes.concat(json.externals)
  let properties = json.properties
  properties = properties.concat(json.externalproperties)
  return group_properties_per_class_aux(json, properties, classes)
};

function group_properties_per_class_aux (json, properties, classes) {
  const grouped = new Map()
  let domain = []
  let v = []

  for (const key in classes) {
    grouped.set(classes[key].extra['EA-Name'], [])
  };
  for (const key in properties) {
    domain = []

    if (!Array.isArray(properties[key].domain)) {
      domain = [properties[key].domain]
    } else {
      domain = properties[key].domain
    };

    for (const d in domain) {
      v = []
      if (grouped.has(domain[d]['EA-Name'])) {
        v = grouped.get(domain[d]['EA-Name'])
        v.push(properties[key])
        grouped.set(domain[d]['EA-Name'], v)
      } else {
        grouped.set(domain[d]['EA-Name'], [properties[key]])
      }
    }
  };
  return grouped
}

/*
 * order the properties according nameA
 *   - iterate over sorted keys? exists?
 */

/*
 * entity-map: EA-Name -> Entity
 */
function entity_map (json) {
  let classes = json.classes
  classes = classes.concat(json.externals)
  let properties = json.properties
  properties = properties.concat(json.externalproperties)
  return entity_map_aux(json, classes, properties)
};

function entity_map_aux (json, classes, properties) {
  const entitymap = new Map()

  for (const key in classes) {
    entitymap.set(classes[key].extra['EA-Name'], classes[key])
  };
  for (const key in properties) {
    entitymap.set(properties[key].extra['EA-Name'], properties[key])
  }
  return entitymap
}

/*
 * TODO:
 *   remove empty shacltemplates and inconsistent shacl template
 */
/* future todo:
 * make shape per property
 */
function make_shacl (mode, grouped, entitymap, language) {
  switch (mode) {
    case 'grouped':
      return make_shacl_grouped(grouped, entitymap, language)
    case 'individual':
      return make_shacl_individual(grouped, entitymap, language)
    default:
      return make_shacl_grouped(grouped, entitymap, language)
  }
}

function make_shacl_grouped (grouped, entitymap, language) {
  console.log('make shacl using grouped mode (default)')

  const shaclTemplates = []
  let shacl = new Map()
  const shaclDoc = new Map()
  let prop = new Map()
  let props = []
  let sorted = []

  grouped.forEach(function (kvalue, kkey, kmap) {
    shacl = new Map()
    shacl['@id'] = options.domain + '#' + kkey + 'Shape'
    shacl['@type'] = 'sh:NodeShape'
    if (entitymap.get(kkey)) {
      shacl['sh:targetClass'] = entitymap.get(kkey)['@id']
    } else { console.log('WARNING: shacl shape for unknown class: ', kkey) }
    shacl['sh:closed'] = false
    props = []
    sorted = kvalue.sort(function (a, b) { if (a.extra['EA-Name'] < b.extra['EA-Name']) { return -1 }; if (a.extra['EA-Name'] > b.extra['EA-Name']) { return 1 }; return 0 })
    Object.entries(sorted).forEach(
      ([pkey, value]) => {
        prop = get_prop(value, language)
        if (value.range.length > 1) {
          console.log('Error: range has more than one value for property ', pkey)
        } else {
          if (value.range.length === 1) {
            if (value['@type'] === 'http://www.w3.org/2002/07/owl#DatatypeProperty') {
              prop['sh:datatype'] = value.range[0].uri
            } else {
              prop['sh:class'] = value.range[0].uri
            }
          }
        };

        if (value.maxCardinality && value.maxCardinality !== '*') { prop['sh:maxCount'] = value.maxCardinality }
        if (value.minCardinality && value.minCardinality !== '0') { prop['sh:minCount'] = value.minCardinality }
        if (value.extra['ap-codelist']) { prop['qb:codeList'] = value.extra['ap-codelist'] } // requires the same codelist reasoning as for the html
        props.push(prop)
      })
    shacl['sh:property'] = props
    shaclTemplates.push(shacl)
  })

  shaclDoc['@context'] = {
    sh: 'http://www.w3.org/ns/shacl#',
    qb: 'http://purl.org/linked-data/cube#',
    'sh:class': { '@type': '@id' },
    'sh:datatype': { '@type': '@id' },
    'sh:path': { '@type': '@id' },
    'sh:property': { '@type': '@id' },
    'sh:targetClass': { '@type': '@id' },
    shapes: { '@type': '@id' },
    'sh:minCount': {
      '@type': 'http://www.w3.org/2001/XMLSchema#integer'
    },
    'sh:maxCount': {
      '@type': 'http://www.w3.org/2001/XMLSchema#integer'
    },
    'qb:codeList': {
      '@type': '@id'
    },
    '@vocab': options.domain,
    'sh:definition': { '@container': '@language' },
    'sh:name': { '@container': '@language' }
  }
  shaclDoc['@id'] = options.domain
  shaclDoc.shapes = shaclTemplates

  return shaclDoc
}

function make_shacl_individual (grouped, entitymap, language) {
  console.log('make shacl using individual mode')

  const shaclTemplates = []
  let shacl = new Map()
  const shaclDoc = new Map()
  let prop = new Map()
  let props = []
  let sorted = []

  grouped.forEach(function (kvalue, kkey, kmap) {
    shacl = new Map()
    const classshapeuri = options.domain + '#' + kkey + 'Shape'
    shacl['@id'] = classshapeuri
    shacl['@type'] = 'sh:NodeShape'
    if (entitymap.get(kkey)) {
      shacl['sh:targetClass'] = entitymap.get(kkey)['@id']
    } else { console.log('WARNING: shacl shape for unknown class: ', kkey) }
    shacl['sh:closed'] = false
    props = []
    sorted = kvalue.sort(function (a, b) { if (a.extra['EA-Name'] < b.extra['EA-Name']) { return -1 }; if (a.extra['EA-Name'] > b.extra['EA-Name']) { return 1 }; return 0 })
    Object.entries(sorted).forEach(
      ([pkey, value]) => {
        const prop0 = get_prop(value, language)
        let prop0name = ''
        if (prop0['sh:name'] != null && prop0['sh:name'][language] != null) {
          prop0name = prop0['sh:name'][language]
        }
        if (value.range.length > 1) {
          console.log('Error: range has more than one value for property ', pkey)
        } else {
          if (value.range.length === 1) {
            prop = { ...prop0 } // use the spread operator to construct a variant of the constraint
            prop['@id'] = classshapeuri + '/' + SHA1(prop0name + 'range')
            if (value['@type'] === 'http://www.w3.org/2002/07/owl#DatatypeProperty') {
              prop['sh:datatype'] = value.range[0].uri
            } else {
              prop['sh:class'] = value.range[0].uri
            }
            props.push(prop)
          }
        };

        if (value.maxCardinality && value.maxCardinality !== '*') {
          prop = { ...prop0 }
          prop['@id'] = classshapeuri + '/' + SHA1(prop0name + 'maxCount')
          prop['sh:maxCount'] = value.maxCardinality
          props.push(prop)
        }
        if (value.minCardinality && value.minCardinality !== '0') {
          prop = { ...prop0 }
          prop['@id'] = classshapeuri + '/' + SHA1(prop0name + 'minCount')
          prop['sh:minCount'] = value.minCardinality
          props.push(prop)
        }
        if (value['ap-codelist']) {
          // XXX TODO add codelist reasoning support
          const noderestriction = {
            '@type': 'sh:NodeShape',
            'rdfs:comment': 'codelist restriction',
            'sh:property': {
              'sh:class': 'skos:ConceptScheme',
              'sh:hasValue': value['ap-codelist'],
              'sh:minCount': '1',
              'sh:nodeKind': 'sh:IRI',
              'sh:path': 'skos:inScheme'
            }
          }
          prop = { ...prop0 }
          prop['@id'] = classshapeuri + '/' + SHA1(prop0name + 'codelist')
          prop['sh:nodeKind'] = 'sh:IRI'
          prop['sh:severity'] = 'sh:Warning'
          prop['sh:node'] = noderestriction
          props.push(prop)
        } // requires the same codelist reasoning as for the html
      })
    shacl['sh:property'] = props
    shaclTemplates.push(shacl)
  })

  shaclDoc['@context'] = {
    sh: 'http://www.w3.org/ns/shacl#',
    qb: 'http://purl.org/linked-data/cube#',
    skos: 'http://www.w3.org/2004/02/skos/core#',
    rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
    'sh:class': {
      '@id': 'sh:class',
      '@type': '@id'
    },
    'sh:datatype': {
      '@id': 'sh:datatype',
      '@type': '@id'
    },
    'sh:path': {
      '@id': 'sh:path',
      '@type': '@id'
    },
    'sh:property': {
      '@id': 'sh:property',
      '@type': '@id'
    },
    'sh:targetClass': {
      '@id': 'sh:targetClass',
      '@type': '@id'
    },
    'sh:node': {
      '@id': 'sh:node',
      '@type': '@id'
    },
    'sh:nodeKind': {
      '@id': 'sh:nodeKind',
      '@type': '@id'
    },
    'sh:hasValue': {
      '@id': 'sh:hasValue',
      '@type': '@id'
    },
    'sh:severity': {
      '@id': 'sh:severity',
      '@type': '@id'
    },
    'sh:minCount': {
      '@id': 'sh:minCount',
      '@type': 'http://www.w3.org/2001/XMLSchema#integer'
    },
    'sh:maxCount': {
      '@id': 'sh:maxCount',
      '@type': 'http://www.w3.org/2001/XMLSchema#integer'
    },
    'sh:definition': {
      '@id': 'sh:definition',
      '@container': '@language'
    },
    'sh:name': {
      '@id': 'sh:name',
      '@container': '@language'
    },
    'qb:codeList': {
      '@id': 'qb:codeList',
      '@type': '@id'
    },
    'rdfs:comment': {
      '@id': 'rdfs:comment'
    },
    shapes: {
      '@id': 'rdfs:member',
      '@type': '@id'
    },
    '@vocab': options.domain
  }
  shaclDoc['@id'] = options.domain
  shaclDoc.shapes = shaclTemplates

  return shaclDoc
}

// assign a URI based on the name of the shape
// XXX TODO: integrate this as an additional mode 
function get_prop_named (classshapeuri, value, language) {
  const name = get_tagged_value(value.label, language)
  const definition = get_tagged_value(value.definition, language)
  if (name == null && definition == null) {
    return { 'sh:path': value['@id'] }
  } else if (name == null && definition != null) {
    return {
      'sh:definition': definition,
      'sh:path': value['@id']
    }
  } else if (name != null && definition == null) {
    return {
      'sh:name': name,
      'sh:path': value['@id'],
      '@id': classshapeuri + '/' + SHA1(name[language])
    }
  } else {
    return {
      'sh:name': name,
      'sh:definition': definition,
      'sh:path': value['@id'],
      '@id': classshapeuri + '/' + SHA1(name[language])
    }
  }
}

function get_prop (value, language) {
  const name = get_tagged_value(value.label, language)
  const definition = get_tagged_value(value.definition, language)
  if (name == null && definition == null) {
    return { 'sh:path': value['@id'] }
  } else if (name == null && definition != null) {
    return {
      'sh:definition': definition,
      'sh:path': value['@id']
    }
  } else if (name != null && definition == null) {
    return {
      'sh:name': name,
      'sh:path': value['@id']
    }
  } else {
    return {
      'sh:name': name,
      'sh:definition': definition,
      'sh:path': value['@id']
    }
  }
}

function get_tagged_value (value, language) {
  if (!(value === undefined)) {
    if (!(value[language] === undefined)) {
      return { [language]: value[language] }
    } else {
      return { [language]: '' }
    }
  }
  return null
}

const jsonfile = require('jsonfile')
const xmlbuilder = require('xmlbuilder2')
const Set = require('collections/set')
const Map = require('collections/map')
const camelCase = require('camelcase')
const program = require('commander')
const fs = require('fs')

program
  .version('1.0.0')
  .usage('node xsd-generator2.js creates a xsd based on a chosen language')
  .option('-i, --input <path>', 'input file (a jsonld file)')
  .option('-o, --output <path>', 'output file (the xsd)')
  .option('-m, --language <languagecode>', 'the language for the xsd (the languagecode)')
  .option('-b, --basenamespace <path>', 'the base namespace for all terms in the xsd')
  .option('-d, --forceDomain', 'force the domain all the terms, instead only for those that are necessary. Default false')
  .option('-l, --useLabels <label>', 'the terms used are { label = the labels in camelCase, uml = the names from the UML},', /^(label|uml)$/i)

program.on('--help', function () {
  console.log('')
  console.log('Examples:')
  console.log('  $ xsd-generator --help')
  console.log('  $ xsd-generator -i <input> -o <output> -m <language>')
  console.log('  $ xsd-generator -i <input> -o <output> -l <useLabels> -m <language>')
})

program.parse(process.argv)
const options = program.opts()
const forceDomain = !!options.forceDomain

render_xsd_from_json_ld_file(options.input, options.output, options.language)
console.log('done')

/* ---- end of the program --- */

function render_xsd_from_json_ld_file (filename, output_filename, language) {
  console.log('start reading')
  jsonfile.readFile(filename)
    .then(
      function (obj) {
        console.log('start processing')

        const grouped = group_properties_per_class(obj)
        const entitymap = entity_map(obj)
        const groupedxsd = make_classes_xsd(grouped, entitymap, language)
// const ggroupedxsdserialize = groupedxsd.end({ prettyPrint: true, wellFormed: true });
        const ggroupedxsdserialize = groupedxsd.end({ prettyPrint: true });
	      console.log(ggroupedxsdserialize)

//        const duplicates = identify_duplicates(obj.properties.concat(obj.externalproperties), language)
//        console.log('the following items have for the same term different URIs assigned:')
//        console.log(duplicates)
//        console.log('they will be disambiguated')
//        const eanamesclasses = get_EAname(obj.classes.concat(obj.externals), language)
//        const xsd = make_xsd(classes(obj, language), properties(eanamesclasses, duplicates, obj, language), externals(obj, language), externalproperties(eanamesclasses, duplicates, obj, language))
//
        console.log('start writing')
	

              fs.writeFile(options.output, ggroupedxsdserialize, function (err) {
                if (err) {
                  console.log('Saving the file failed')
                  console.log(err)
                }
              })

//        jsonfile.writeFile(output_filename, xsd.toObject())
//          .then(res => {
//            console.log('Write complete, saved to: ' + output_filename)
//          })
//          .catch(error => { console.error(error); process.exitCode = 1 })
      }
    )
    .catch(error => { console.error(error); process.exitCode = 1 })
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
 * identify duplicates by iterating over the list and comparing if the same term is
 * being used to identify multiple values
 */
function identify_duplicates (properties, language) {
  let acc = new Map()
  acc = properties.reduce(function (accumulator, currentValue, currentIndex, array) {
    return urireducer(accumulator, currentValue, currentIndex, array, 'nl')
  }, acc)

  // search for duplicates
  const acc2 = new Map()
  acc.forEach(function (value, key, map) {
    if (value.length > 1) {
      const tempSet = new Set(value)
      if (tempSet.length > 1) {
        // duplicate found, because more than one entry
        acc2.set(key, value)
      }
    }
  })

  return acc2
};

// auxiliary function to convert a string into CamelCase
/*
const toCamelCase = str =>
  str.toLowerCase()
    .replace(/[^a-zA-Z0-9]+(.)/g, (m, chr) => chr.toUpperCase())
    */

const capitalizeFirst = (s) => {
  if (typeof s !== 'string') return ''
  return s.charAt(0).toUpperCase() + s.slice(1)
}

const removeSpecialChars = (s) => {
  if (typeof s !== 'string') return ''
  return s.replace(/[^a-zA-Z0-9]/g, '');
}

// auxiliary function to convert to camelcase with dealing special cases
// TODO: what are the guidelines for contextual scoping in the labels?
function toCamelCase (str) {
  str = camelCase(str)
  // console.log(str)
  str = str.replace(/\s\(source\)/g, '(source)').replace(/\s\(target\)/g, '(target)')
  // console.log(' -> ' + str)
  return str
};

// map an entity prop to its term
function map_identifier (prop, language) {
  let identifier = ''
  if (options.useLabels === 'label') {
    if (prop.label && prop.label[language]) {
      identifier = toCamelCase(prop.label[language])
      //      console.log(identifier)
    } else {
      console.log('Warning: no ' + language + ' label for entity, using fallback EA-Name')
      identifier = prop.extra['EA-Name']
      console.log('   Fallback applied for ' + identifier)
    }
  } else {
    identifier = prop.extra['EA-Name']
  };
  return identifier
};

// create a map (term -> list of uri)
function urireducer (accumulator, currentValue, currentIndex, array, language) {
  let currentlist = []
  const term = map_identifier(currentValue, language)
  if (accumulator.has(term)) {
    currentlist = accumulator.get(term)
    currentlist.push(currentValue['@id'])
    accumulator.set(term, currentlist)
  } else {
    accumulator.set(term, [currentValue['@id']])
  };
  return accumulator
};

function get_EAname (entities, language) {
  let acc = new Map()
  acc = entities.reduce(function (accumulator, currentValue, currentIndex, array) {
    return EAname(accumulator, currentValue, currentIndex, array, language)
  }, acc)

  return acc
}

// create a map (EA-Name -> term)
function EAname (accumulator, currentValue, currentIndex, array, language) {
  let currentlist = []
  const term = map_identifier(currentValue, language)
  const eaname = currentValue.extra['EA-Name']
  if (accumulator.has(eaname)) {
    currentlist = accumulator.get(eaname)
    console.log('ERROR: multiple values for the same EA-Name ' + eaname)
    console.log('       value ' + currentlist + ' will be overwritten with ' + term)
    accumulator.set(eaname, term)
  } else {
    accumulator.set(eaname, term)
  };
  return accumulator
};

// TODO: collection.js documentation does not specify{
// if the values get overwritten for existing keys
//
const accXSD = (accumulator, currentValue) =>
  accumulator.addEach(currentValue)

function make_xsd (classes, properties, externals, externalproperties) {
  console.log('make xsd')

  const xsd = new Map()
  let xsdbody = new Map()

  if (classes !== null) { xsdbody = classes.reduce(accXSD, new Map()) }
  if (properties !== null) { xsdbody = properties.reduce(accXSD, xsdbody) }
  if (externals !== null) { xsdbody = externals.reduce(accXSD, xsdbody) }
  if (externalproperties !== null) { xsdbody = externalproperties.reduce(accXSD, xsdbody) }

  xsdbody = {

    'xs:schema': 
	  { '@xmlns:xs': 'http://www.w3.org/2001/XMLSchema',
	    'xs:element': [{
		    '@name' : 'CLASS'
	    },{
		    '@name' : 'CLASS2'
	    }]
	  }

  }
  let root = xmlbuilder.create(xsdbody)

  return root
}

/* TODO: handle classhierarchy grouping
   it should be possible to based on a class-hierarchy to create
   a context file per applicationprofile per class
   This requires knowledge in the input about the class hierarchy
*/
function map_class (c, language) {
  const mapping = new Map()
  const identifier = map_identifier(c, language)
  mapping.set(capitalizeFirst(identifier), c['@id'])
  return mapping
};

function classes (json, language) {
  const classes = json.classes
  let classmapping = new Map()
  classmapping = classes.map(x => map_class(x, language))
  return classmapping
}

function map_properties (eanamesclasses, duplicates, prop, language) {
  const mapping = new Map()

  let range
  let range_uri = ''
  let identifier = ''

  if (prop.range.length === 0) {
    console.log('warning: no range for ' + prop.name)
  } else {
    if (prop.range.length > 1) {
      console.log('warning: more than one type for ' + prop.name + ' : ' + prop.range)
      range = prop.range[0]
      range_uri = range.uri
    } else {
      range = prop.range[0]
    };
    range_uri = range.uri
  };
  let atType = ''
  if (prop['@type'] === 'http://www.w3.org/2002/07/owl#ObjectProperty') {
    atType = '@id'
  } else {
    // assume a literal
    atType = range_uri
  };

  identifier = map_identifier(prop, language)
  let propc = {}
  let key = ''
  if (duplicates.has(identifier) || forceDomain) {
    // duplicate
    const domain = prop.extra['EA-Domain']
    if (domain === '') {
      console.log('ERROR: no domain found to disambiguate ' + identifier)
      console.log('An overwrite will happen')
    } else {
      key = capitalizeFirst(eanamesclasses.get(domain)) + '.' + identifier
    }
  } else {
    // no duplicate
    key = identifier
  };

  if (prop.maxCardinality !== '0' & prop.maxCardinality !== '1') {
    propc = {
      '@id': prop['@id'],
      '@type': atType,
      '@container': '@set' // support @language case
    }
  } else {
    propc = {
      '@id': prop['@id'],
      '@type': atType
    }
  };
  // add to the map, only if it is not yet present
  if (mapping.has(key)) {
    console.log('warning: duplicate key ' + key + ' value ' + mapping[key])
  } else {
    mapping.set(key, propc)
  };

  return mapping
}

function properties (eanamesclasses, duplicates, json, language) {
  const props = json.properties

  let propertymapping = new Map()
  propertymapping = props.map(x => map_properties(eanamesclasses, duplicates, x, language))

  return propertymapping
}

function map_external (c, language) {
  const mapping = new Map()
  const identifier = map_identifier(c, language)
  mapping.set(capitalizeFirst(identifier), c['@id'])
  return mapping
};

function externals (json, language) {
  const externs = json.externals

  let externalmapping = new Map()
  externalmapping = externs.map(x => map_external(x, language))

  return externalmapping
}

function externalproperties (eanamesclasses, duplicates, json, language) {
  const externs = json.externalproperties

  let externalmapping = new Map()
  externalmapping = externs.map(x => map_properties(eanamesclasses, duplicates, x, language))

  return externalmapping
}



function make_classes_xsd(grouped, entitymap, language) {
  console.log('make xsd using grouped mode (default)')

  let xsd = new Map()
  let complexType = new Map()
  let complexTypes= addDefaultComplexTypes()
  let xmlelement = new Map()
  let xmlelements = []
  const xsdDoc = new Map()
  let prop = new Map()
  let props = []
  let sorted = []

  grouped.forEach(function (kvalue, kkey, kmap) {
    complexType = {}
    xsdelement = {}
    complexType['@xmlns:cv'] = options.basenamespace
    let classname = ''
    if (entitymap.get(kkey)) {
      classname = capitalizeFirst(removeSpecialChars(map_identifier(entitymap.get(kkey), language)))
      complexType['@name'] = classname + 'Type'
      xmlelement={
	      '@xmlns:cv': options.basenamespace,
	      '@name' : classname,
	      '@type' : classname + 'Type'
      }


    } else { console.log('WARNING: xsd shape for unknown class: ', kkey) }
    props = []
    sorted = kvalue.sort(function (a, b) { if (a.extra['EA-Name'] < b.extra['EA-Name']) { return -1 }; if (a.extra['EA-Name'] > b.extra['EA-Name']) { return 1 }; return 0 })
    Object.entries(sorted).forEach(
      ([pkey, value]) => {
	prop={}
	let propname = removeSpecialChars(map_identifier(value, language))
        prop['@name'] = propname 
        if (value.range.length > 1) {
          console.log('Error: range has more than one value for property ', pkey)
        } else {
          if (value.range.length === 1) {
            if (value.range[0].uri === 'http://www.w3.org/1999/02/22-rdf-syntax-ns#langString') {
		    prop['@type'] = 'xs:string'
	    } else if (value.range[0].uri === 'http://www.w3.org/2000/01/rdf-schema#Literal') {
		    prop['@type'] = 'xs:string'
	    } else if (value['@type'] === 'http://www.w3.org/2002/07/owl#DatatypeProperty') {
		let localrange = value.range[0].uri
		let localrange0 = localrange.replace(/^http:\/\/www.w3.org\/2001\/XMLSchema#/,"xs:")
              	prop['@type'] = localrange0
	    } else if (value.range[0].uri === 'http://www.w3.org/2004/02/skos/core#Concept') {
              	prop['@type'] = 'ConceptType'
            } else {
		console.log(value.range[0])
		let propRangeName = value.range[0]['EA-Name'] 
    		if (entitymap.get(propRangeName)) { 
      		     let rangename = capitalizeFirst(map_identifier(entitymap.get(propRangeName), language))
      		     prop['@ref'] = rangename
    		} else { console.log('Warning: range is unknown class: ', propRangeName) }
            }
          }
        };
	  console.log(prop)

        if ((value.maxCardinality && value.maxCardinality !== '*') && (value.maxCardinality && value.maxCardinality !== 'n'))
	      { prop['@maxOccurs'] = value.maxCardinality } else { prop['@maxOccurs'] = 'unbounded' }
        if (value.minCardinality && value.minCardinality !== '0') { prop['@minOccurs'] = value.minCardinality } else { prop['@minOccurs'] = '0' }

	prop['xs:annotation'] = {
		"xs:documentation" :{
			'@xml:lang' : options.language,
			'#' : value.definition[options.language]
		}
	}
	      /*
        <xs:annotation>
            <xs:documentation xml:lang="en">Indicates the validity period of the Evidence.</xs:documentation>
        </xs:annotation>
	*/

        props.push(prop)
      })

    complexType['xs:sequence'] = {'xs:element' : props }
    if (entitymap.get(kkey)) { complexType['xs:attribute'] = addEntityRef(classname) }
    complexTypes.push(complexType)
    xmlelements.push(xmlelement)
  })

  console.log(complexTypes)

  let xmlbuilderoptions = { 'encoding': 'UTF-8', standalone: true }

  let target = xmlbuilder.create(xmlbuilderoptions,
	  {
	  'xs:schema' : {
	  '@xmlns' : options.basenamespace,
	  '@xmlns:xs': 'http://www.w3.org/2001/XMLSchema',
          '@targetNamespace' : options.basenamespace,
          '@version' : '2.0.0',
          '@elementFormDefault' : 'qualified',
          '@attributeFormDefault' : 'unqualified',
          '@xmlns:cv' : options.basenamespace,
	  'xs:element' : xmlelements, 
	  'xs:complexType' : complexTypes}}
)

  return target
}

/* Example 
 * <xs:attribute name="periodOfTimeRef" type="xsd:IDREFS">
 *       <xs:annotation>
 *           <xs:documentation xml:lang="en">Reference to PeriodOfTime ID.</xsd:documentation>
 *       </xs:annotation>
 *   </xs:attribute>
 **/
function addEntityRef(Entity) {

	let entityRef = {
			    '@name' : Entity+'Ref',
			    '@type' : 'xs:IDREF',
		            'xs:annotation' : {
			    'xs:documentation' :{
				'@xml:lang' : options.language,
				'#' : 'Reference to ' + Entity + ' ID'
				}}
			    }

	return entityRef
}

/*
 *    <xs:complexType name="ConceptType">
    <xs:simpleContent>
      <xs:extension base="xs:string">
        <xs:attribute name="country" type="xs:string" />
      </xs:extension>
    </xs:simpleContent>
  </xs:complexType>

  <xs:complexType name="langstring">
     <xs:simpleContent>
	  <xs:extension base="xs:string">
		  <xs:attribute name="lang" type="xs:language"/>
	  </xs:extension>
     </xs:simpleContent>
  </xs:complexType>
  */

function addDefaultComplexTypes () {
	
	let default0 = {
		'@name' : 'langstring',
                 'xs:simpleContent' : {
			'xs:extension' : {
				'@base' : 'xs:string',
		      'xs:attribute' : {
			    '@name' : 'lang',
			    '@type' : 'xs:language'
		    	}
			}}
		}
	let default1 = {
		'@name' : 'ConceptType',
                 'xs:simpleContent' : {
			'xs:extension' : {
				'@base' : 'xs:token',
		      'xs:attribute' : [{
			    '@name' : 'ref',
			    '@type' : 'xs:IDREF'
		    	}, {
			    '@name' : 'conceptSchemeRef',
			    '@type' : 'xs:IDREF'
            }
            ]
			}}
		}

	return [default0,default1]
}


function get_prop (value, language) {
  const name = get_tagged_value(value.label, language)
  if (name == null ) {
	  console.log('Error: no value for label of property')
    return {}
  } else {
    return {
      '@name': name
    }
  }
}

function get_tagged_value (value, language) {
  if (!(value === undefined)) {
    if (!(value[language] === undefined)) {
      return value[language] 
    } else {
      return null
    }
  }
  return null
}

# Javascript version of the specification generator

## Running this tool
To run this tool you can simply use the following command:
```
> node cls.js [JSON-LD FILENAME] [NUNJUCKS TEMPLATE] [OUTPUT HTML]
```
An example:
```
> node cls.js gebouw.jsonld gebouw-voc.j2 gebouw.html
```
Running the above example will result in an HTML file that contains the ontology described in gebouw.jsonld and format it using the gebouw-voc.j2nunjucks template.

## Strucutre of this repository
This repository contains 2 things:
* The implementation for the javascript version of the specification generator. The idea is that this version does the exact same thing (functionally) as the python version that can be found on the public OSLO github page. But as intake it would only receive json-ld files as opposed to the turtle files and csv files that the python version receives today. We will further enlarge the functionality with the production of all different linked data artifacts (ttl-files, rdf-files, json-ld contexts, ...) which are today being postprocessed by a ruby tool.
* The second artifact in this repository is the specification format for the JSON-LD structure that we will use internally. This specification needs to be propagated to the EAP2RDF tool.

## Specification generator JS version
To minimize the impact of a different implementation language for the specification generator we will leave the templating engine untouched from an external perspective. The python implementation used Jinja2. We will use nunchucks.js for this version.

### necessary changes to the templates
So far I have encountered the following issues:
#### absence of a variable that is undergoing filtering
When a filter (selectattr, lower, ...) is used on a non existent variable then the template will crash. The solution here is to test the presence of the variable prior to filtering:
```
{% if object.property %}
  {{ object.property | lower }}
{% endif %}
```
#### lower() empty parameter method call not supported
In jinja the following construct is valid
```
# NOT SUPPORTED IN NUNJUCKS
{{ "TEST".lower()}}
```
for nunchucks this needs to be written as a 'true' filter such as
```
{{ "TEST" | lower }}
```

#### the complex form of the selectattr filter is not supported
The Jinja2 selectattr filter is not supported in the complex case. The simple case is supported though;
In jinja2 the following would filter out all object for which the property is set to 1
```
# NOT SUPPORTED IN NUNJUCKS
{{ objects | selectattr('property', 'equalto', 1)}}
```

The simple case of this filter is similar but wil only test for truthy values ( property in object && object.property != false ). This would look like:
```
{{ objects | selectattr('property')}}
```
To handle the complex case in nunjucks the following construct, base on groupings will work:
```
{% for property, objects in objects | groupby(property) %}
  {% if property == 1 %}
    # handle the filtered objects here
  {% endif %}
{% endfor %}
```

### Nunjucks JSON format
The nunjucks also receives its data in a JSON format. This format will be distilled from the JSON-LD by the specification generator. It's form is like this:
```
{
    record: {
        metadata: {
         title: {
             nl: "Gebouw - vocabularium",
             en: "Building"
         },
            abstract: {
                nl: "Dit is een samenvatting van de idee die door dit vocabularium beschreven wordt.",
                en: "This is a summary of the idea of a building."
            },
            comment: {
                nl: "Dit is een commentaar die helpt om het vocabularium te begrijpen.",
                en: "This is a comment in English."
            },
            prefix: "Gebouw",
            issued: "TBD",
            modified: "2018-03-07",
            uri: "http://gebouw.com",
            rights: "Vlaamse Overheid",
            mname: "geen idee wiens naam dat hier is, mss medewerker?",
            mmbox: "mailto:oslo@kb.vlaanderen.be"
        },
        parents: {
            list: "comma,separated,list,of,parents,is,what,i,guess"
        },
        classes: [
            {
                name: {
                    nl: "2D Gebouwgeometrie",
                    en: "2D Geometry for Buldings"
                },
                description: {
                    nl: "Geometrie van het gebouw en metadata over welk deel van het gebouw door de geometrie wordt voorgesteld en hoe deze werd bepaald.",
                    en: "The geomatry of a building"
                },
                uri: "http://data.vlaanderen.be/ns/gebouw#2DGebouwgeometrie"
            }
        ],
        properties:
        [
            {
                name: {
                    nl: "aantal verdiepingen",
                    en: "number of stories"
                },
                uri: "http://data.vlaanderen.be/ns/gebouw#aantalVerdiepingen",
                domain: [
                    "http://data.vlaanderen.be/ns/gebouw#Gebouw"
                ],
                range: [
                    "http://www.w3.org/2001/XMLSchema#integer"
                ],
                description: {
                    nl: "Totaal van het aantal boven- en ondergrondse gebouwlagen, bekeken over alle gebouwdelen heen.",
                    en: "to be translated"
                }
            }
        ],
        external_terms: [
            {
                name: {
                    nl: "Agent",
                    en: "Agent"
                },
                uri: "http://purl.org/dc/terms/Agent"
            },
        ]
    },
    contributors: [
        {
            role: "A|E|C",
            first_name: "fn",
            last_name: "ln",
            affiliation: {
                name: "aff",
                website: "url"
            },
            email: "a@a.com"
        }
    ]
}
```

## JSON-LD format
There are 2 forms of a JSON-LD format in this project. And they are closely related. They are the internal format that is being described here. And an external format that contains no data in itself; only contexts but that would help any consumer/producer of data within these vocabularies to use the vocabulary. This last artifact is one of the results of the toolchain.

This is an example of some vocabulary described in JSON-LD, I should still extract the context.

```
{
  "@context": {
    "vlaanderen": "http://data.vlaanderen.be/ns/",
    "owl": "http://www.w3.org/2002/07/owl#",
    "void": "http://rdfs.org/ns/void#",
    "dcterms": "http://purl.org/dc/terms/",
    "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
    "dcat": "http://www.w3.org/ns/dcat#",
    "sdmx-dimension": "http://purl.org/linked-data/sdmx/2009/dimension#",
    "rdfs": "http://www.w3.org/2000/01/rdf-schema#",
    "sdmx-attribute": "http://purl.org/linked-data/sdmx/2009/attribute#",
    "qb": "http://purl.org/linked-data/cube#",
    "skos": "http://www.w3.org/2004/02/skos/core#",
    "xsd": "http://www.w3.org/2001/XMLSchema#",
    "sdmx-concept": "http://purl.org/linked-data/sdmx/2009/concept#",
    "foaf": "http://xmlns.com/foaf/0.1/",
    "person": "http://www.w3.org/ns/person#",
    "rec": "http://www.w3.org/2001/02pd/rec54#",

    "label": {
      "@id": "rdfs:label",
      "@container": "@language"
    },
    "modified": {
      "@id": "dcterms:modified",
      "@type": "xsd:date"
    },
    "authors": {
      "@type": "person:Person",
      "@id": "foaf:maker"
    },
    "editors": {
      "@type": "person:Person",
      "@id": "rec:editor"
    },
    "contributors": {
      "@type": "person:Person",
      "@id": "dcterms:contributor"
    },
    "affiliation": {
      "@id": "http://schema.org/affiliation"
    },
    "classes": {
      "@id": "rdfs:isDefinedBy"
    },
    "name": {
      "@id": "rdfs:label",
      "@container": "@language"
    },
    "description": {
      "@id": "rdfs:comment",
      "@container": "@language"
    },
    "properties": {
      "@id": "rdfs:isDefinedBy"
    },
    "domain": {
      "@id": "rdfs:domain"
    },
    "range": {
      "@id": "rdfs:range"
    },
    "externals": {
      "@id": "rdfs:seeAlso"
      },
    "label": {
      "@id": "rdfs:label",
      "@container": "@language"
    }
  },

  "@id": "vlaanderen:gebouw",
  "@type": "owl:Ontology",
  "label": {
  "nl": "Gebouw",
  "en": "Building"
  },
  "modified": "8-10-2018",
  "dcterms:issued": "TBD",

  "authors": [
    {
      "foaf:first_name": "Jonathan",
      "foaf:last_name": "Langens",
      "foaf:mbox": "jonathan.langens@tenforce.com",
      "@type": "person:Person",
      "affiliation": {
        "foaf:name": "TenForce",
        "foaf:homepage": "http://www.tenforce.com"
      }
    }
  ],

  "editors": [
    {
      "foaf:first_name": "Bert",
      "foaf:last_name": "Van Nuffelen",
      "foaf:mbox": "bert.vannuffelen@tenforce.com",
      "@type": "person:Person",
      "affiliation": {
        "foaf:name": "TenForce",
        "foaf:homepage": "http://www.tenforce.com"
      }
    }
  ],

  "contributors": [
  ],

  "externals": [
    {
      "@id": "http://www.w3.org/ns/org#FormalOrganization",
      "@type": "rdfs:Class",
      "label": {
        "nl": "Formele Organisatie"
      }
    }
  ],

  "@reverse": {
    "classes": [
      {
        "@id": "http://data.vlaanderen.be/ns/gebouw#Gebouweenheid",
        "@type": "owl:Class",
        "name": {
          "nl": "Gebouweenheid",
          "en": "Building unit"
        },
        "description": {
          "nl": "Dit is de beschrijving van een gebouweenheid.",
          "en": "This is the description of a building unit."
        }
      }
    ],

    "properties": [
      {
        "@id": "http://data.vlaanderen.be/ns/gebouw#aantalVerdiepingen",
        "@type": "owl:ObjectProperty",
        "name": {
          "nl": "aantal verdiepeingen",
          "en": "number of stories"
        },
        "domain": [
          "http://data.vlaanderen.be/ns/gebouw#Gebouw"
        ],
        "range": [
          "http://www.w3.org/2001/XMLSchema#integer"
        ],
        "description": {
          "nl": "Totaal van het aantal boven- en ondergrondse gebouwlagen, bekeken over alle gebouwdelen heen.",
          "en": "to be translated"
        }
      }
    ]
  }
}

```

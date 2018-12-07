# prefixes
## vlaanderen
```http://data.vlaanderen.be/ns/ ```
## owl
```http://www.w3.org/2002/07/owl#```
## void
```http://rdfs.org/ns/void#```
## dcterms
```http://purl.org/dc/terms/ ```
## rdf
```http://www.w3.org/1999/02/22-rdf-syntax-ns#```
## dcat
```http://www.w3.org/ns/dcat#```
## sdmx
```ension": "http://purl.org/linked-data/sdmx/2009/dimension#```
## rdfs
```http://www.w3.org/2000/01/rdf-schema#```
## sdmx
```ribute": "http://purl.org/linked-data/sdmx/2009/attribute#```
## qb
```http://purl.org/linked-data/cube#```
## skos
```http://www.w3.org/2004/02/skos/core#```
## xsd
```http://www.w3.org/2001/XMLSchema#```
## sdmx
```cept": "http://purl.org/linked-data/sdmx/2009/concept#```
## foaf
```http://xmlns.com/foaf/0.1/ ```
## person
```http://www.w3.org/ns/person#```

# vocabularium
There is some metadata in the nunjucks JSON that is describing the vocabularium, in linked data it is defined like this:
```
<http://data.vlaanderen.be/ns/gebouw> a owl:Ontology ;
	rdfs:label "Building"@en , "Gebouw"@nl .
```

# contributors
In the JSON that we feed into nunjucks the contributors are encoded as an array on the contributors key in that JSON object. Each object in the contributors array has 4 properties (first_name, last_name, email, role) and 1 relation an affiliation (which has a name and a website):
```
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
```
## type
All contributors are of type person:Person:
```_:node1cq9crqhfx13 a <http://www.w3.org/ns/person#Person> .```

## roles
While roles are defined as a property on the contributor object it is defined as a relation on the vocabulary/application profile in linked data.
### auteur
```<http://data.vlaanderen.be/ns/gebouw> <http://xmlns.com/foaf/0.1/maker> _:node1cq9crqhfx24 .```

### editor
```<http://data.vlaanderen.be/ns/gebouw> <http://www.w3.org/2001/02pd/rec54#editor> _:node1cq9crqhfx18 .```

### contributor
```<http://data.vlaanderen.be/ns/gebouw> dcterms:contributor _:node1cq9crqhfx11 .```

## contact info
### first_name
```<http://xmlns.com/foaf/0.1/firstName> "Francois" ;```
### last_name
```<http://xmlns.com/foaf/0.1/lastName> "Du Mortier" ;```
### email
```<http://xmlns.com/foaf/0.1/mbox> <mailto:communication@cirb.brussels> ```

## affiliation
### relation
```_:node1cq9crqhfx13 <http://schema.org/affiliation> _:node1cq9crqhfx14 ;```
### object
```_:node1cq9crqhfx14 <http://xmlns.com/foaf/0.1/homepage> <http://cirb.brussels/> ;
	<http://xmlns.com/foaf/0.1/name> "CIRB" .
```

# classes
The nunjucks JSON representation contains a key class classes which holds an array such as:
```
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
```
## type
```<http://data.vlaanderen.be/ns/gebouw#Gebouweenheid> a owl:Class ;```

## subtype
```
<http://data.vlaanderen.be/ns/gebouw#Gebouweenheid>	rdfs:subClassOf <http://data.vlaanderen.be/ns/adres#AdresseerbaarObject> , rdfs:Resource .
```

## link to vocabulary
```<http://data.vlaanderen.be/ns/gebouw#Gebouweenheid>	rdfs:isDefinedBy <http://data.vlaanderen.be/ns/gebouw> ;```

## name (language)
```<http://data.vlaanderen.be/ns/gebouw#Gebouweenheid>	rdfs:label "Gebouweenheid"@nl ;```

## description (language)
```
<http://data.vlaanderen.be/ns/gebouw#Gebouweenheid>	rdfs:comment "De kleinste eenheid binnen een gebouw die geschikt is voor woon-, bedrijfsmatige, of recreatieve doeleinden en die ontsloten wordt via een eigen afsluitbare toegang vanaf de openbare weg, een erf of een gedeelde circulatieruimte. Een gebouweenheid is in functioneel opzicht zelfstandig. Daarnaast kan een gebouweenheid ook een gemeenschappelijk deel zijn."@nl ;
```



# properties
The nunjucks JSON contains a key called properties which holds an array like this:
```
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
        ]
```
## type
```<http://data.vlaanderen.be/ns/gebouw#Gebouw.geometrie> a owl:ObjectProperty```

## connection to vocabulary
```<http://data.vlaanderen.be/ns/gebouw#Gebouw.geometrie> rdfs:isDefinedBy <http://data.vlaanderen.be/ns/gebouw> ;```

## name (language)
```<http://data.vlaanderen.be/ns/gebouw#Gebouw.geometrie>	rdfs:label "geometrie"@nl ;```

## description (language)
```<http://data.vlaanderen.be/ns/gebouw#Gebouw.geometrie> rdfs:comment "2D geometrische voorstelling van het gebouw."@nl ;```

## domain
```<http://data.vlaanderen.be/ns/gebouw#Gebouw.geometrie> rdfs:domain <http://data.vlaanderen.be/ns/gebouw#Gebouw> ;```

## range
```<http://data.vlaanderen.be/ns/gebouw#Gebouw.geometrie> rdfs:range <http://data.vlaanderen.be/ns/gebouw#2DGebouwgeometrie> .```

# externals
In nunjucks the externals look like:
```
        external_terms: [
            {
                name: {
                    nl: "Agent",
                    en: "Agent"
                },
                uri: "http://purl.org/dc/terms/Agent"
            },
        ]
```
External classes are being defined like this:
```
<http://www.w3.org/ns/org#FormalOrganization> a rdfs:Class ;
	rdfs:label "Formele Organisatie"@nl .
```

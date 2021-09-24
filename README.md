[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
![Build status](https://github.com/informatievlaanderen/OSLO-SpecificationGenerator/actions/workflows/ci.yml/badge.svg)

# OSLO SpecificationGenerator

> The OSLO specification generator is a collection of tools to generate various artifacts based on the output of the OSLO tool EA-to-RDFn such as an HTML page, JSON-LD context and SHACL template.

## Packages

### HTML Generator

Generates an HTML page that must be rendered by a static Web server and has data.vlaanderen.be as its main target.

> Usage is explained [here](https://github.com/Informatievlaanderen/OSLO-SpecificationGenerator/tree/master/packages/oslo-generator-html)

### Context Generator

Generates a JSON-LD context file.

> Usage is explained [here](https://github.com/Informatievlaanderen/OSLO-SpecificationGenerator/tree/master/packages/oslo-generator-jsonld)

### Mu-config Generator

Generates a mu-semtech-project configuration based on the JSON-LD of your specification.

> Usage is explained [here](https://github.com/Informatievlaanderen/OSLO-SpecificationGenerator/tree/master/packages/oslo-generator-mu-config)

### SHACL Generator

Generates a SHACL template based on the specification

> Usage is explained [here](https://github.com/Informatievlaanderen/OSLO-SpecificationGenerator/tree/master/packages/oslo-generator-shacl)

### Vocabulary Generator

Generates a JSON-LD vocabulary file

> Usage is explained [here](https://github.com/Informatievlaanderen/OSLO-SpecificationGenerator/tree/master/packages/oslo-generator-vocabulary)

### Translator

Generates a translation file and then merges it with the original specification.

> Usage is explained [here](https://github.com/Informatievlaanderen/OSLO-SpecificationGenerator/tree/master/packages/oslo-translator-report)

### OSLO Types

Contains the types used in the packages. 

> More info [here](https://github.com/Informatievlaanderen/OSLO-SpecificationGenerator/tree/master/packages/oslo-types)

## License

OSLO SpecificationGenerator is written and maintained by the [Open Standards for Linked Organizations (OSLO) team](https://data.vlaanderen.be) and released under the [MIT License](http://opensource.org/licenses/MIT)



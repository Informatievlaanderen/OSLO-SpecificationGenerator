# OSLO-SpecificationGenerator

OSLO-SpecificationGenerator is a CLI to generate HTML specifications from RDF vocabularies.

## Table of Contents
* [Overview](#overview)
* [Installation](#installation)
  * [Requirements](#requirements)
  * [Installing](#installing)
* [Running](#running)
* [Development](#development)
  * [Setting up a Development Environment](#setting-up-a-development-environment)
  * [Adding Another Target Schema](#adding-another-target-schema)
  * [Bugs and Issues](#bugs-and-issues)
* [Contact](#contact)


## Overview

OSLO-SpecificationGenerator is a Python package to generate HTML documentation for RDF Vocabularies.


## Installation

OSLO-SpecificationGenerator is best installed and used within a Python virtualenv.

### Requirements

* Python 3.5 and above.
* Python [virtualenv](https://virtualenv.pypa.io/) package


### Installing

```bash
virtualenv my-env
cd my-env

. bin/activate   # Linux
Scripts\activate # Windows

git clone https://github.com/InformatieVlaanderen/OSLO-SpecificationGenerator.git
cd OSLO-SpecificationGenerator
pip install -r requirements.txt
```

## Running

Leave out the `--output` option to write to stdout instead of a file.

### List all options with their explanation

```bash
./specgen/generate_vocabulary.py --help
```

### Generating contributors RDF from CSV

```bash
./specgen/generate_vocabulary.py --contributors --csv {csv_path} --csv_contributor_role_column {column} --output {output_path}
```

### Merging contributors RDF with a vocabulary RDF

```bash
./specgen/generate_vocabulary.py --merge --rdf {vocabulary_rdf_path} --rdf_contributor {contributors_rdf_path} --output {output_path}
```

### Generating vocabulary HTML specification from RDF

```bash
./specgen/generate_vocabulary.py --rdf {rdf_path} --output {output_path}
```

### Generating application profile in HTML from an AP CSV

In this repository only a Dutch template is available.

The AP CSV needs be converted from an Enterprise Architect file (.eap) using the [Enterprise Architect RDF Conversion Tool](https://github.com/Informatievlaanderen/OSLO-EA-to-RDF).

To use another template, use the `--schema_folder` option to specify the folder containing your templates.
See the section on other schemes for more information.

```bash
./specgen/generate_vocabulary.py --ap --csv {csv_path} --csv_contributor {csv_contributor_path} --output {output_path}
```


### Generating a (basic) application profile from RDF

In this repository only Dutch application profiles are supported.

```bash
./specgen/generate_vocabulary.py --ap --rdf {path} --csv_contributor {csv_contributor_path} --output {output_path}
```


## Development

### Setting up a Development Environment

Same as installing a package.  Use a virtualenv.  Also install developer requirements:

```bash
pip install -r requirements-dev.txt
```

### Available Templates

All commands use a default template, this default can be overridden using the
`--schema` parameter.

The templates can be found in the `templates` folder. Additionally,
on can specify an additional (external) folder containing templates using the
`--schema_folder` parameter.

Templates use the [Jinja2 library](http://jinja.pocoo.org/docs/).

### Bugs and Issues

All bugs, enhancements and issues are managed on [GitHub](https://github.com/InformatieVlaanderen/OSLO-SpecificationGenerator/issues).

## Contact

* [Informatie Vlaanderen](mailto:oslo@kb.vlaanderen.be)

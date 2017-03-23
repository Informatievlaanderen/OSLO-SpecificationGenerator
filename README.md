[![Build Status](https://travis-ci.org/InformatieVlaanderen/OSLO-SpecificationGenerator.png)](https://travis-ci.org/InformatieVlaanderen/OSLO-SpecificationGenerator)

# OSLO-SpecificationGenerator

OSLO-SpecificationGenerator is a Python package and CLI to generate HTML specifications from RDF vocabularies.

## Table of Contents
* [Overview](#overview)
* [Features](#features)
* [Installation](#installation)
  * [Requirements](#requirements)
  * [Dependencies](#dependencies)
  * [Installing the Package](#installing-the-package)
* [Running](#running)
* [Development](#development)
  * [Setting up a Development Environment](#setting-up-a-development-environment)
  * [Adding Another Target Schema](#adding-another-target-schema)
  * [Running Tests](#running-tests)
  * [Bugs and Issues](#bugs-and-issues)
* [Contact](#contact)


## Overview

OSLO-SpecificationGenerator is a Python package to generate HTML documentation for RDF Vocabularies.

## Features

* simple configuration: inspired by Python's ConfigParser
* extensible: template architecture allows for easy addition of new metadata formats
* flexible: use as a command-line tool or integrate as a library

## Installation

OSLO-SpecificationGenerator is best installed and used within a Python virtualenv.

### Requirements

* Python 3.5 and above.
* Python [virtualenv](https://virtualenv.pypa.io/) package

### Dependencies

Dependencies are listed in [requirements.txt](requirements.txt). Dependencies are automatically installed during specgen's installation.

### Installing the Package

```bash
virtualenv my-env
cd my-env
. bin/activate
git clone https://github.com/InformatieVlaanderen/OSLO-SpecificationGenerator.git
cd OSLO-SpecificationGenerator
pip install -r requirements.txt
python setup.py build
python setup.py install
```

## Running

Leave out the `--output` option to write to stdout instead of a file.

### List all options with their explanation

```bash
./bin/generate_vocabulary.py --help
```

### Generating contributors RDF from CSV

```bash
./bin/generate_vocabulary.py --csv {csv_path} --contributors --target {column} --output {output_path}
```

### Merging contributors RDF with a vocabulary RDF

```bash
./bin/generate_vocabulary.py --rdf {vocabulary_rdf_path} --rdf_contributor {contributors_rdf_path} --merge --output {output_path}
```

### Generating vocabulary HTML specification from RDF

By default the English template will be used.

```bash
./bin/generate_vocabulary.py --rdf {rdf_path} --output {output_path}
```

To use the Dutch template, use the following command.

```bash
./bin/generate_vocabulary.py --rdf {rdf_path} --output {output_path} --schema vocabularynl
```

### Generating application profile in HTML from CSV

In this repository only a Dutch template is available.

To use another template, use the `--schema_local` option with the path where the other template is located.
See the section on other schemes for more information.

```bash
./bin/generate_vocabulary.py --csv {csv_path} --ap --output {output_path}
```

## Development

### Setting up a Development Environment

Same as installing a package.  Use a virtualenv.  Also install developer requirements:

```bash
pip install -r requirements-dev.txt
```

### Adding Another Target Schema

List of supported metadata schemas in specgen/templates/`

To add support to new metadata schemas:
```bash
cp -r specgen/templates/vocabulary specgen/templates/new-schema
```
Then modify `*.j2` files in the new `specgen/templates/new-schema` directory to comply to new schema.

### Running Tests

```bash
# via distutils
python setup.py test
# manually
cd samples
python run_samples.py
```

### Bugs and Issues

All bugs, enhancements and issues are managed on [GitHub](https://github.com/InformatieVlaanderen/OSLO-SpecificationGenerator/issues).

## Contact

* [Informatie Vlaanderen](mailto:oslo@kb.vlaanderen.be)
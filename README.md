[![Build Status](https://travis-ci.org/InformatieVlaanderen/OSLO-SpecificationGenerator.png)](https://travis-ci.org/InformatieVlaanderen/OSLO-SpecificationGenerator)

# OSLO-SpecificationGenerator

OSLO-SpecificationGenerator is a Python package to generate specifications from RDF vocabularies.

## Table of Contents
* [Overview](#overview)
* [Features](#features)
* [Quickstart](#quickstart)
* [Installation](#installation)
  * [Requirements](#requirements)
  * [Dependencies](#dependencies)
  * [Installing the Package](#installing-the-package)
* [Running](#running)
* [Development](#development)
  * [Setting up a Development Environment](#setting-up-a-development-environment)
  * [Adding Another Metadata Schema to the Core](#adding-another-metadata-schema-to-the-core)
  * [Running Tests](#running-tests)
  * [Code Conventions](#code-conventions)
  * [Bugs and Issues](#bugs-and-issues)
* [History](#history)
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

## Generating vocabulary documentation

## Generating application profile documentation

## Development

### Setting up a Development Environment

Same as installing a package.  Use a virtualenv.  Also install developer requirements:

```bash
pip install -r requirements-dev.txt
```

### Adding Another Target Schema to the Core

List of supported metadata schemas in `specgen/templates/`

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

## Contact (this branch only)

* [Informatie Vlaanderen](mailto:oslo@kb.vlaanderen.be)
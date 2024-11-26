# OSLO-Toolchain-CI

## Packages

The repository contains the following packages:

- `metadata-generator` This package is a metadata generation script specifically to be used by the OSLO-toolchain

## Developer information

### Lerna Setup

This repository uses Lerna to manage multiple packages. Lerna helps in managing the dependencies, versioning, and publishing of the packages. Please refer to the [Lerna documentation](https://lerna.js.org/docs/introduction) for more information on Lerna itself.

#### Lerna Configuration

The Lerna configuration is defined in the [`lerna.json`](lerna.json) file:

### Workspaces

To build the source code, the dependencies must first be installed. We make use op npm workspaces, so the dependencies of all packages are installed as well. More information on workspaces can be found [here](https://docs.npmjs.com/cli/v10/using-npm/workspaces). The setup looks like this:

```json
{
  "workspaces": ["packages/*"]
}
```

#### Getting started

```bash
npm install
```

#### Publising a new version of a package

To publish a new version of a package, you can use the following command:

```bash
lerna publish
```

Or if you want to publish a new version of a specific package:

```bash
cd packages/<package-name>
npm publish --access public
```

## Copyright

This code is copyrighted by [Digitaal Vlaanderen](https://www.vlaanderen.be/digitaal-vlaanderen) and released under the [MIT license](./LICENSE)

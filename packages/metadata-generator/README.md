# `metadata-generator`

> A metadata generation script specifically to be used by the OSLO-toolchain

## Installation

```sh
npm install @oslo-flanders/metadata-generator
```

## Global installation

To use the service from the command line anywhere, you can install it globally.

```sh
npm install -g @oslo-flanders/metadata-generator
```

## API

The service is executed from the CLI and expects the following parameters:
| Parameter | Description | Required | Possible values |
| --------- | --------- | ----------- | --------------- |
| `--hostname` | The public hostname/domain on which the HTML is published. The hostname in the input file takes precedence. | No ||
| `--documentpath` | The document path on which the HTML is published | No ||
| `--mainlanguage` | The language to display (a language code string) | No ||
| `--primarylanguage` | The primary language of the publication environment (a language code string) | No ||
| `--uridomain` | The domain of the URIs that should be excluded from this vocabulary | No ||
| `--input` | Input file | :heavy_check_mark: ||
| `--output` | Output file (the metadata file) | :heavy_check_mark: ||
| `--prefix` | Prefix for the logging | No ||

## Usage

```bash
metadata-generator --input input.json --output output.json --mainlanguage nl --prefix "[INFO] "
metadata-generator -h example.com -r /docs -i input.json -o output.json -m nl -g nl -u example.com -p "[INFO] "
```

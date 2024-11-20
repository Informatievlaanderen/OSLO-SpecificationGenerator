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
| `--hostname`, `-h` | The public hostname/domain on which the HTML is published. The hostname in the input file takes precedence. | :heavy_check_mark: ||
| `--documentpath`, `-r` | The document path on which the HTML is published | :heavy_check_mark: ||
| `--mainlanguage`, `-m` | The language to display (a language code string) | :heavy_check_mark: ||
| `--primarylanguage`, `-g` | The primary language of the publication environment (a language code string) | :heavy_check_mark: ||
| `--uridomain`, `-u` | The domain of the URIs that should be excluded from this vocabulary | :heavy_check_mark: ||
| `--input`, `-i` | Input file | :heavy_check_mark: ||
| `--output`, `-o` | Output file (the metadata file) | :heavy_check_mark: ||
| `--prefix`, `-p` | Prefix for the logging | No ||

## Usage

```bash
metadata-generator --input input.json --output output.json --mainlanguage nl --prefix "[INFO] "
metadata-generator -h example.com -r /docs -i input.json -o output.json -m nl -g nl -u example.com -p "[INFO] "
```

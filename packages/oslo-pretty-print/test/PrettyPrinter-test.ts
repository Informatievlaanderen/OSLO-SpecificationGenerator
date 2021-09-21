import fs = require('fs/promises');
import { OSLOReport } from '@oslo-flanders/types';
import jsonfile = require('jsonfile');
import type { IPrettyPrintOptions } from '../lib/PrettyPrinter';
import { PrettyPrinter } from '../lib/PrettyPrinter';

describe('Vocabulary Generator', () => {
  let report: OSLOReport;
  let options: IPrettyPrintOptions;

  beforeEach(async () => {
    const data = await jsonfile.readFile('./test/files/input.jsonld');
    report = new OSLOReport(data);
  });

  afterEach(async () => {
    await fs.unlink(options.outputFile);
  });

  it('should pretty print the report with the default settings', async () => {
    options = {
      outputFile: 'output-default.jsonld',
      descendingSort: false,
      sortingAttributes: ['foaf:lastName', 'foaf:firstName'],
      sortingKeys: ['authors', 'editors', 'contributors'],
    };

    const generator = new PrettyPrinter(report, options);
    await generator.generateSpecification();

    const [expectedOutput, generatedOutput] = await Promise.all([
      fs.readFile('./test/files/output-default.jsonld'),
      fs.readFile(options.outputFile),
    ]);

    expect(JSON.parse(expectedOutput.toString())).toMatchObject(JSON.parse(generatedOutput.toString()));
  });

  it('should pretty print the report with the descending option set', async () => {
    options = {
      outputFile: 'output-descending.jsonld',
      descendingSort: true,
      sortingAttributes: ['foaf:lastName', 'foaf:firstName'],
      sortingKeys: ['authors', 'editors', 'contributors'],
    };

    const generator = new PrettyPrinter(report, options);
    await generator.generateSpecification();

    const [expectedOutput, generatedOutput] = await Promise.all([
      fs.readFile('./test/files/output-descending.jsonld'),
      fs.readFile(options.outputFile),
    ]);

    expect(JSON.parse(expectedOutput.toString())).toMatchObject(JSON.parse(generatedOutput.toString()));
  });

  it('should pretty print the report with sorting attributes set to "foaf:firstName"', async () => {
    options = {
      outputFile: 'output-sorting-attributes.jsonld',
      descendingSort: false,
      sortingAttributes: ['foaf:firstName'],
      sortingKeys: ['authors', 'editors', 'contributors'],
    };

    const generator = new PrettyPrinter(report, options);
    await generator.generateSpecification();

    const [expectedOutput, generatedOutput] = await Promise.all([
      fs.readFile('./test/files/output-sorting-attributes.jsonld'),
      fs.readFile(options.outputFile),
    ]);

    expect(JSON.parse(expectedOutput.toString())).toMatchObject(JSON.parse(generatedOutput.toString()));
  });

  // eslint-disable-next-line max-len
  it('should pretty print the report with sorting attributes set to "desc:foaf:firstName" and only sorting editors', async () => {
    options = {
      outputFile: 'output-asc-sorting-attributes-sorting-keys.jsonld',
      descendingSort: false,
      sortingAttributes: ['desc:foaf:firstName'],
      sortingKeys: ['editors'],
    };

    const generator = new PrettyPrinter(report, options);
    await generator.generateSpecification();

    const [expectedOutput, generatedOutput] = await Promise.all([
      fs.readFile('./test/files/output-asc-sorting-attributes-sorting-keys.jsonld'),
      fs.readFile(options.outputFile),
    ]);

    expect(JSON.parse(expectedOutput.toString())).toMatchObject(JSON.parse(generatedOutput.toString()));
  });

  it('should overrule --descending options when a sorting attribute with prefix "asc:" is provided', async () => {
    options = {
      outputFile: 'output-descending-overruled.jsonld',
      descendingSort: true,
      sortingAttributes: ['asc:foaf:firstName'],
      sortingKeys: ['editors'],
    };

    const generator = new PrettyPrinter(report, options);
    await generator.generateSpecification();

    const [expectedOutput, generatedOutput] = await Promise.all([
      fs.readFile('./test/files/output-descending-overruled.jsonld'),
      fs.readFile(options.outputFile),
    ]);

    expect(JSON.parse(expectedOutput.toString())).toMatchObject(JSON.parse(generatedOutput.toString()));
  });
});

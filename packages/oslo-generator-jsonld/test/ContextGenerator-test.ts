import fs = require('fs/promises');
import { OSLOReport } from '@oslo-flanders/types';
import jsonfile = require('jsonfile');
import type { IContextGeneratorOptions } from '../lib/ContextGenerator';
import { ContextGenerator } from '../lib/ContextGenerator';

// FIXME: Test sometimes fail for option set to UML
describe('Vocabulary Generator', () => {
  let report: OSLOReport;
  let options: IContextGeneratorOptions;

  beforeAll(async () => {
    const englishData = await jsonfile.readFile('./test/files/input-english.jsonld');
    report = new OSLOReport(englishData);
  });

  afterEach(async () => {
    await fs.unlink(options.outputFile);
  });

  it('should generate a specification with useLabels option set to \'label\'', async () => {
    options = {
      outputFile: 'output.jsonld',
      language: 'en',
      forceDomain: false,
      labelChoice: 'label',
    };

    const generator = new ContextGenerator(report, options);
    await generator.generateSpecification();

    const [expectedOutput, generatedOutput] = await Promise.all([
      fs.readFile('./test/files/output-labels.jsonld'),
      fs.readFile(options.outputFile),
    ]);

    expect(JSON.parse(expectedOutput.toString())).toMatchObject(JSON.parse(generatedOutput.toString()));
  });

  it('should generate a specification with forceDomain option set and useLabels option set to \'label\'', async () => {
    options = {
      outputFile: 'output.jsonld',
      language: 'en',
      forceDomain: true,
      labelChoice: 'label',
    };

    const generator = new ContextGenerator(report, options);
    await generator.generateSpecification();

    const [expectedOutput, generatedOutput] = await Promise.all([
      fs.readFile('./test/files/output-force-domain-and-labels.jsonld'),
      fs.readFile(options.outputFile),
    ]);

    expect(JSON.parse(expectedOutput.toString())).toMatchObject(JSON.parse(generatedOutput.toString()));
  });

  it('should generate a specification with useLabels option set to \'uml\'', async () => {
    options = {
      outputFile: 'output.jsonld',
      language: 'en',
      forceDomain: false,
      labelChoice: 'uml',
    };

    const generator = new ContextGenerator(report, options);
    await generator.generateSpecification();

    const [expectedOutput, generatedOutput] = await Promise.all([
      fs.readFile('./test/files/output-uml.jsonld'),
      fs.readFile(options.outputFile),
    ]);

    expect(JSON.parse(expectedOutput.toString())).toMatchObject(JSON.parse(generatedOutput.toString()));
  });

  it('should generate a specification with forceDomain option set and useLabels option set to \'uml\'', async () => {
    options = {
      outputFile: 'output.jsonld',
      language: 'en',
      forceDomain: true,
      labelChoice: 'uml',
    };

    const generator = new ContextGenerator(report, options);
    await generator.generateSpecification();

    const [expectedOutput, generatedOutput] = await Promise.all([
      fs.readFile('./test/files/output-force-domain-and-uml.jsonld'),
      fs.readFile(options.outputFile),
    ]);

    expect(JSON.parse(expectedOutput.toString())).toMatchObject(JSON.parse(generatedOutput.toString()));
  });
});

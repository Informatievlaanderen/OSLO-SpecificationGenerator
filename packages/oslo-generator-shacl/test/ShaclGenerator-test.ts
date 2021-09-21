import fs = require('fs/promises');
import { OSLOReport } from '@oslo-flanders/types';
import jsonfile = require('jsonfile');
import type { IShaclGeneratorOptions } from '../lib/ShaclGenerator';
import { ShaclGenerator } from '../lib/ShaclGenerator';

describe('SHACL Generator', () => {
  let englishReport: OSLOReport;
  let dutchReport: OSLOReport;
  let options: IShaclGeneratorOptions;

  beforeAll(async () => {
    const englishData = await jsonfile.readFile('./test/files/input-english.jsonld');
    const dutchData = await jsonfile.readFile('./test/files/input-dutch.jsonld');
    englishReport = new OSLOReport(englishData);
    dutchReport = new OSLOReport(dutchData);
  });

  beforeEach(() => {
    options = {
      outputFile: 'output.jsonld',
      constraints: [],
      domain: 'undefined',
      mode: 'grouped',
      language: 'en',
      publishedAt: '',
      useConstraintLabel: false,
    };
  });

  afterEach(async () => {
    await fs.unlink(options.outputFile);
  });

  it('should generate a specification in mode \'grouped\'', async () => {
    const generator = new ShaclGenerator(englishReport, options);
    await generator.generateSpecification();

    const [expectedOutput, generatedOutput] = await Promise.all([
      fs.readFile('./test/files/output-grouped-mode.jsonld'),
      fs.readFile(options.outputFile),
    ]);

    expect(JSON.parse(expectedOutput.toString())).toMatchObject(JSON.parse(generatedOutput.toString()));
  });

  it('should generate a speficiation in mode \'individual\'', async () => {
    options.mode = 'individual';
    const generator = new ShaclGenerator(englishReport, options);
    await generator.generateSpecification();

    const [expectedOutput, generatedOutput] = await Promise.all([
      fs.readFile('./test/files/output-individual-mode.jsonld'),
      fs.readFile(options.outputFile),
    ]);

    expect(JSON.parse(expectedOutput.toString())).toMatchObject(JSON.parse(generatedOutput.toString()));
  });

  it('should not generate a constraint when maxCardinality has value \'n\'', async () => {
    options.language = 'nl';
    options.mode = 'individual';
    options.domain = 'https://data.vlaanderen.be/shacl/DCAT-AP-VL';

    const generator = new ShaclGenerator(dutchReport, options);
    await generator.generateSpecification();

    const [expectedOutput, generatedOutput] = await Promise.all([
      fs.readFile('./test/files/output-no-constraint.jsonld'),
      fs.readFile(options.outputFile),
    ]);

    expect(JSON.parse(expectedOutput.toString())).toMatchObject(JSON.parse(generatedOutput.toString()));
  });

  it('should add a uniqueLanguages constraint when the option is set', async () => {
    options.language = 'nl';
    options.mode = 'individual';
    options.domain = 'https://data.vlaanderen.be/shacl/DCAT-AP-VL';
    options.constraints = ['uniqueLanguages'];

    const generator = new ShaclGenerator(dutchReport, options);
    await generator.generateSpecification();

    const [expectedOutput, generatedOutput] = await Promise.all([
      fs.readFile('./test/files/output-unique-languages-constraint.jsonld'),
      fs.readFile(options.outputFile),
    ]);

    expect(JSON.parse(expectedOutput.toString())).toMatchObject(JSON.parse(generatedOutput.toString()));
  });

  it('should add rdfs:seeAlso if \'publishedAt\' options is set', async () => {
    options.language = 'nl';
    options.mode = 'individual';
    options.domain = 'https://data.vlaanderen.be/shacl/DCAT-AP-VL';
    options.constraints = ['uniqueLanguages'];
    options.publishedAt = 'https://data.vlaanderen.be/doc/applicatieprofiel/DCAT-AP-VL/ontwerpstandaard/2021-06-27';

    const generator = new ShaclGenerator(dutchReport, options);
    await generator.generateSpecification();

    const [expectedOutput, generatedOutput] = await Promise.all([
      fs.readFile('./test/files/output-see-also.jsonld'),
      fs.readFile(options.outputFile),
    ]);

    expect(JSON.parse(expectedOutput.toString())).toMatchObject(JSON.parse(generatedOutput.toString()));
  });

  it('should add \'nodeKind\' constraint when the options is set', async () => {
    options.language = 'nl';
    options.mode = 'individual';
    options.domain = 'https://data.vlaanderen.be/shacl/DCAT-AP-VL';
    options.constraints = ['uniqueLanguages', 'nodeKind'];
    options.publishedAt = 'https://data.vlaanderen.be/doc/applicatieprofiel/DCAT-AP-VL/ontwerpstandaard/2021-06-27';

    const generator = new ShaclGenerator(dutchReport, options);
    await generator.generateSpecification();

    const [expectedOutput, generatedOutput] = await Promise.all([
      fs.readFile('./test/files/output-nodekind-constraint.jsonld'),
      fs.readFile(options.outputFile),
    ]);

    expect(JSON.parse(expectedOutput.toString())).toMatchObject(JSON.parse(generatedOutput.toString()));
  });
});

import fs = require('fs/promises');
import { OSLOReport } from '@oslo-flanders/types';
import jsonfile = require('jsonfile');
import type { IVocabularyGeneratorOptions } from '../lib/VocabularyGenerator';
import { VocabularyGenerator } from '../lib/VocabularyGenerator';

describe('Vocabulary Generator', () => {
  let englishReport: OSLOReport;
  let dutchReport: OSLOReport;
  let options: IVocabularyGeneratorOptions;

  beforeAll(async () => {
    const englishData = await jsonfile.readFile('./test/files/input-english.jsonld');
    const dutchData = await jsonfile.readFile('./test/files/input-dutch.jsonld');
    englishReport = new OSLOReport(englishData);
    dutchReport = new OSLOReport(dutchData);
  });

  afterEach(async () => {
    await fs.unlink(options.outputFile);
  });

  it('should generate a dutch specification when the option is set', async () => {
    options = {
      outputFile: 'output.jsonld',
      language: 'nl',
    };

    const generator = new VocabularyGenerator(dutchReport, options);
    await generator.generateSpecification();

    const [expectedOutput, generatedOutput] = await Promise.all([
      fs.readFile('./test/files/output-dutch.jsonld'),
      fs.readFile(options.outputFile),
    ]);

    expect(JSON.parse(expectedOutput.toString())).toMatchObject(JSON.parse(generatedOutput.toString()));
  });

  it('should generate an english specification when the option is set', async () => {
    options = {
      outputFile: 'output.jsonld',
      language: 'en',
    };

    const generator = new VocabularyGenerator(englishReport, options);
    await generator.generateSpecification();

    const [expectedOutput, generatedOutput] = await Promise.all([
      fs.readFile('./test/files/output-english.jsonld'),
      fs.readFile(options.outputFile),
    ]);

    expect(JSON.parse(expectedOutput.toString())).toMatchObject(JSON.parse(generatedOutput.toString()));
  });
});

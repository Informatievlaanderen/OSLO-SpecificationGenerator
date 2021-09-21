import fs = require('fs/promises');
import { OSLOReport } from '@oslo-flanders/types';
import jsonfile = require('jsonfile');
import type { IMuConfigGeneratorOptions } from '../lib/MuConfigGenerator';
import { MuConfigGenerator } from '../lib/MuConfigGenerator';

describe('Vocabulary Generator', () => {
  let report: OSLOReport;
  let options: IMuConfigGeneratorOptions;

  beforeAll(async () => {
    const englishData = await jsonfile.readFile('./test/files/input-english.jsonld');
    report = new OSLOReport(englishData);
  });

  afterEach(async () => {
    await fs.rm(options.outputDirectory, { recursive: true });
  });

  it('should generate a domain.lisp and repository.lisp file and include externals if set', async () => {
    options = {
      outputDirectory: 'test/data',
      targetLanguage: 'en',
      includeExternals: true,
      stringType: false,
    };

    const generator = new MuConfigGenerator(report, options);
    await generator.generateSpecification();

    const [
      expectedOutputDomain,
      generatedOutputDomain,
      expectedOutputRepository,
      generatedOutputRepository,
    ] = await Promise.all([
      fs.readFile('./test/files/domain-include-externals.lisp'),
      fs.readFile(`${options.outputDirectory}/domain.lisp`),
      fs.readFile('./test/files/repository.lisp'),
      fs.readFile(`${options.outputDirectory}/repository.lisp`),
    ]);

    expect(expectedOutputDomain).toEqual(generatedOutputDomain);
    expect(expectedOutputRepository).toEqual(generatedOutputRepository);
  });

  it('should generate a domain.lisp and repository.lisp file and exclude externals if set', async () => {
    options = {
      outputDirectory: 'test/data',
      targetLanguage: 'en',
      includeExternals: false,
      stringType: false,
    };

    const generator = new MuConfigGenerator(report, options);
    await generator.generateSpecification();

    const [
      expectedOutputDomain,
      generatedOutputDomain,
      expectedOutputRepository,
      generatedOutputRepository,
    ] = await Promise.all([
      fs.readFile('./test/files/domain-exclude-externals.lisp'),
      fs.readFile(`${options.outputDirectory}/domain.lisp`),
      fs.readFile('./test/files/repository.lisp'),
      fs.readFile(`${options.outputDirectory}/repository.lisp`),
    ]);

    expect(expectedOutputDomain).toEqual(generatedOutputDomain);
    expect(expectedOutputRepository).toEqual(generatedOutputRepository);
  });
});

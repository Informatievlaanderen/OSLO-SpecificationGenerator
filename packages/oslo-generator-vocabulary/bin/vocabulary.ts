#!/usr/bin/env node

import { OSLOReport } from '@oslo-flanders/types';
import type { OptionValues } from 'commander';
import { program } from 'commander';
import jsonfile = require('jsonfile');
import { VocabularyGenerator } from '../lib/VocabularyGenerator';

program
  .usage('creates a json-ld vocabulary based on a chosen language')
  .requiredOption('-i, --input <path>', 'input file (a jsonld file)')
  .option('-o, --output <path>', 'output file (the context). Defaults to vocabulary.jsonld', 'vocabulary.jsonld')
  .option(
    '-l, --language <languagecode>',
    'the language for the context (the languagecode). Defaults to nl (dutch)',
    'nl',
  )
  .parse();

const options = program.opts();

const run = async (_options: OptionValues): Promise<void> => {
  const data = await jsonfile.readFile(_options.input);
  const report = new OSLOReport(data);
  const generator = new VocabularyGenerator(
    report,
    {
      language: _options.language,
      outputFile: _options.output,
    },
  );

  await generator.generateSpecification();
};

run(options).catch(error => console.log(error));

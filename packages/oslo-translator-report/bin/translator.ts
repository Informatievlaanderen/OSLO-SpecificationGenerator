#!/usr/bin/env node

import { OSLOReport } from '@oslo-flanders/types';
import type { OptionValues } from 'commander';
import { program } from 'commander';
import jsonfile = require('jsonfile');
import { ReportTranslator } from '../lib/ReportTranslator';

program
  .requiredOption('-i, --input <path>', 'path to an JSON-LD input file')
  .requiredOption('-m, --primeLanguage', 'Language in which the report was created (language code)')
  .requiredOption('-g, --goalLanguage', 'Language in which the report must be translated')
  .option('-o, --output', 'Path of the output file. Default: translation.jsonld', 'translation.jsonld')
  .parse();

const options = program.opts();

const run = async (_options: OptionValues): Promise<void> => {
  const data = await jsonfile.readFile(_options.input);
  const report = new OSLOReport(data);
  const generator = new ReportTranslator(report, {
    baseLanguage: _options.primeLanguage,
    targetLanguage: _options.goalLanguage,
    outputFile: _options.output,
  });
  await generator.generateSpecification();
};

run(options).catch(error => console.log(error));

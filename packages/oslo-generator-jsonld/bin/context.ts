import { OSLOReport } from '@oslo-flanders/types';
import type { OptionValues } from 'commander';
import { program } from 'commander';
import jsonfile = require('jsonfile');
import { ContextGenerator } from '../lib/ContextGenerator';

program
  .usage('creates a json-ld context based on a chosen language')
  .requiredOption('-i, --input <path>', 'input file (a jsonld file)')
  .option('-o, --output <path>', 'output file (the context). Defaults to context.jsonld', 'context.jsonld')
  .option('-m, --language <languagecode>',
    'the language for the context (the languagecode). Defaults to nl (dutch)',
    'nl')
  .option('-d, --forceDomain',
    'force the domain all the terms, instead only for those that are necessary. Defaults to false false',
    false)
  .option('-l, --useLabels <label>',
    'the terms used are { label = the labels in camelCase, uml = the names from the UML}. Defaults to "uml"',
    'uml')
  .parse();

const options = program.opts();

const run = async (_options: OptionValues): Promise<void> => {
  const data = await jsonfile.readFile(_options.input);
  const report = new OSLOReport(data);
  const generator = new ContextGenerator(
    report,
    {
      outputFile: _options.output,
      forceDomain: _options.forceDomain,
      labelChoice: _options.useLabels,
      language: _options.language,
    },
  );

  await generator.generateSpecification();
};

run(options).catch(error => console.error(error));

#!/usr/bin/env node

import { OSLOReport } from '@oslo-flanders/types';
import type { OptionValues } from 'commander';
import { program } from 'commander';
import jsonfile = require('jsonfile');
import { ShaclGenerator } from '../lib/ShaclGenerator';

program
  .requiredOption('-i, --input <path>', 'path to an JSON-LD input file')
  .option('-d, --domain <path>',
    'domain of the shacl shapes, without #. Default http://example.org',
    'http://example.org')
  .option('-l, --language <languagecode>',
    'the language in which shacl must be generated. Default: nl (dutch)',
    'nl')
  .option('-o, --output <path>', 'output shacl file. Defaults: shacl.jsonld', 'shacl.jsonld')
  .option('-m, --mode <mode>',
    'the generation mode of the shacl shapes. One of {grouped, individual}. Default: grouped',
    'grouped')
  .option('-c, --constraints [constraints...]',
    // eslint-disable-next-line max-len
    'additional contstraints to be generated. Possible values [stringsNotEmpty, uniqueLanguages,nodekind]. Default: none')
  .option('-p, --publishedAt <url>', 'the URL at which the specification is being published')
  .option('-u, --useConstraintLabel',
    // eslint-disable-next-line max-len
    'Use the contraintlabel to generate the constraint id. Intended usage for creating a stable basis for manual constraints that can be merged with autogenerated. Default: false')
  .parse();

const options = program.opts();

const run = async (_options: OptionValues): Promise<void> => {
  const data = await jsonfile.readFile(_options.input);
  const report = new OSLOReport(data);
  const generator = new ShaclGenerator(
    report,
    {
      outputFile: _options.output,
      language: _options.language,
      domain: _options.domain || '',
      mode: _options.mode,
      constraints: _options.constraints || [],
      publishedAt: _options.publishedAt || '',
      useConstraintLabel: _options.useConstraintLabel || false,
    },
  );

  await generator.generateSpecification();
};

run(options).catch(error => console.log(error));

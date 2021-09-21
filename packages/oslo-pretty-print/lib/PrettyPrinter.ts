import type { ISpecification, OSLOReport } from '@oslo-flanders/types';
import { logger } from '@oslo-flanders/types';
import jsonfile = require('jsonfile');
import { helper } from './Helpers';

export interface IPrettyPrintOptions {
  outputFile: string;
  sortingKeys: string[];
  sortingAttributes: string[];
  descendingSort: boolean;
}

export class PrettyPrinter implements ISpecification {
  public report: OSLOReport;
  public options: IPrettyPrintOptions;

  public constructor(report: OSLOReport, options: IPrettyPrintOptions) {
    this.report = report;
    this.options = options;
  }

  public generateSpecification = async (): Promise<void> => {
    const originalObject = this.report.getOriginalData();
    const attributeObjects = helper.getSortAttributeObjects(
      this.options.descendingSort,
      this.options.sortingAttributes,
    );

    this.options.sortingKeys.forEach((key: string) => {
      helper.keySort(originalObject, key, helper.attributeSort(attributeObjects));
    });

    jsonfile.writeFile(this.options.outputFile, originalObject, { spaces: 2 })
      .then(() => {
        logger.info(`[PrettyPrinter]: JSON-LD context successfully save to ${this.options.outputFile}.`);
      })
      .catch((error: any) => {
        logger.error(`[PrettyPrinter]: Something went wrong when writing to ${this.options.outputFile}:`);
        logger.error(error);
      });
  };
}

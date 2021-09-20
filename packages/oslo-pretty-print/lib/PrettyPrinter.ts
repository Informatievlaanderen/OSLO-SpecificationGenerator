import type { ISpecification, OSLOReport } from '@oslo-flanders/types';
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
    const reportObject = JSON.parse(JSON.stringify(this.report));
    const attributeObjects = helper.getSortAttributeObjects(
      this.options.descendingSort,
      this.options.sortingAttributes,
    );

    this.options.sortingKeys.forEach((key: string) => {
      helper.keySort(reportObject, key, helper.attributeSort(attributeObjects));
    });

    jsonfile.writeFile(this.options.outputFile, reportObject, { spaces: 2 })
      .then(() => {
        console.log(`[PrettyPrinter]: JSON-LD context successfully save to ${this.options.outputFile}.`);
      })
      .catch((error: any) => {
        console.log(`[PrettyPrinter]: Something went wrong when writing to ${this.options.outputFile}.`);
        console.log(error);
      });
  };
}

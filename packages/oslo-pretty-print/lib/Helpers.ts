export class Helper {
  public readonly getSortAttributeObjects = (descendingSort: boolean, sortingAttributes: any[]): any[] => {
    const sortAttributeObjects: any[] = [];

    sortingAttributes.forEach(sortAttribute => {
      let ascending = !descendingSort;
      let attribute = sortAttribute;

      if (sortAttribute.startsWith('asc:')) {
        ascending = true;
        attribute = sortAttribute.slice(4, sortAttribute.length);
      } else if (sortAttribute.startsWith('desc:')) {
        ascending = false;
        attribute = sortAttribute.slice(5, sortAttribute.length);
      }

      sortAttributeObjects.push({
        ascending,
        attribute,
      });
    });

    return sortAttributeObjects;
  };

  public attributeSort = (attributeObjects: any[]): any => function (objectA: any, objectB: any): number {
    for (const element of attributeObjects) {
      if (element.ascending) {
        if (objectA[element.attribute] < objectB[element.attribute]) {
          return -1;
        }
        if (objectA[element.attribute] > objectB[element.attribute]) {
          return 1;
        }
      } else {
        if (objectA[element.attribute] < objectB[element.attribute]) {
          return 1;
        }
        if (objectA[element.attribute] > objectB[element.attribute]) {
          return -1;
        }
      }
    }

    return 0;
  };

  public keySort = (reportObject: any, key: string, sortFunction: (attributeArray: any[]) => number): any => {
    const arrayToSort = reportObject[key];
    reportObject[key] = arrayToSort.sort(sortFunction);
  };
}

export const helper = new Helper();

export class TreeItem {
  children: TreeItem[];
  name: string;
  frontType: string;
  order: number;
}

export class TreeItemFlatNode {
  name: string;
  level: number;
  expandable: boolean;
  frontType: string;
  order: number;
}

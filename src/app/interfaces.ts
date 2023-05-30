export class TreeItem {
  id: number;
  children: TreeItem[];
  name: string;
  frontType: string;
  order: number;
}

export class TreeItemFlatNode {
  id: number;
  name: string;
  level: number;
  expandable: boolean;
  frontType: string;
  order: number;
}

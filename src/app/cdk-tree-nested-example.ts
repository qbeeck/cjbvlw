import { FlatTreeControl } from '@angular/cdk/tree';
import { Component, Injectable, ElementRef, ViewChild } from '@angular/core';
import {
  MatTreeFlatDataSource,
  MatTreeFlattener,
} from '@angular/material/tree';
import { BehaviorSubject } from 'rxjs';

export class Category {
  children: Category[];
  name: string;
  frontType: string;
  order: number;
}

export class CategoryFlatNode {
  name: string;
  level: number;
  expandable: boolean;
  frontType: string;
  order: number;
}

/**
 * Checklist database, it can build a tree structured Json object.
 * Each node in Json object represents a to-do item or a category.
 * If a node is a category, it has children items and new items can be added under the category.
 */
@Injectable()
export class ChecklistDatabase {
  dataChange = new BehaviorSubject<Category[]>([]);

  get data(): Category[] {
    return this.dataChange.value;
  }

  constructor() {
    const data = [
      {
        id: 15461,
        name: 'Sushi | Category',
        order: 1,
        frontType: 'category',
        children: [
          {
            id: 15462,
            name: 'Nori | Subcategory',
            order: 1,
            frontType: 'subCategory',
            children: [
              {
                id: 159863,
                name: 'Product #2',
                order: 2,
                frontType: 'product',
                children: [
                  {
                    id: 159864,
                    name: 'Subproduct #4',
                    order: 3,
                    frontType: 'subProduct',
                  },
                ],
              },
              {
                id: 159859,
                name: 'Product #1',
                order: 1,
                frontType: 'product',
                children: [],
              },
            ],
          },
          {
            id: 159861,
            name: 'Product #2',
            order: 1,
            frontType: 'product',
            children: [
              {
                id: 159862,
                name: 'asdas | Subproduct #1',
                order: 2,
                frontType: 'subProduct',
              },
            ],
          },
          {
            id: 159860,
            name: 'Product #1',
            order: 2,
            frontType: 'product',
            children: [],
          },
        ],
      },
    ];

    this.dataChange.next(data as any);
  }

  /** Add an item to to-do list */
  insertItem(parent: Category, name: string): Category {
    if (!parent.children) {
      parent.children = [];
    }
    const newItem = { name } as Category;
    parent.children.push(newItem);
    this.dataChange.next(this.data);
    return newItem;
  }

  insertItemAbove(node: Category, name: string): Category {
    const parentNode = this.getParentFromNodes(node);
    const newItem = { name } as Category;
    if (parentNode != null) {
      parentNode.children.splice(parentNode.children.indexOf(node), 0, newItem);
    } else {
      this.data.splice(this.data.indexOf(node), 0, newItem);
    }
    this.dataChange.next(this.data);
    return newItem;
  }

  insertItemBelow(node: Category, name: string): Category {
    const parentNode = this.getParentFromNodes(node);
    const newItem = { name } as Category;
    if (parentNode != null) {
      parentNode.children.splice(
        parentNode.children.indexOf(node) + 1,
        0,
        newItem
      );
    } else {
      this.data.splice(this.data.indexOf(node) + 1, 0, newItem);
    }
    this.dataChange.next(this.data);
    return newItem;
  }

  getParentFromNodes(node: Category): Category | null {
    for (let i = 0; i < this.data.length; ++i) {
      const currentRoot = this.data[i];
      const parent = this.getParent(currentRoot, node);
      if (parent != null) {
        return parent;
      }
    }
    return null;
  }

  getParent(currentRoot: Category, node: Category): Category | null {
    if (currentRoot.children && currentRoot.children.length > 0) {
      for (let i = 0; i < currentRoot.children.length; ++i) {
        const child = currentRoot.children[i];
        if (child === node) {
          return currentRoot;
        } else if (child.children && child.children.length > 0) {
          const parent = this.getParent(child, node);
          if (parent != null) {
            return parent;
          }
        }
      }
    }

    return null;
  }

  deleteItem(node: Category) {
    this.deleteNode(this.data, node);
    this.dataChange.next(this.data);
  }

  copyPasteItem(from: Category, to: Category): Category {
    const newItem = this.insertItem(to, from.name);
    if (from.children) {
      from.children.forEach((child) => {
        this.copyPasteItem(child, newItem);
      });
    }
    return newItem;
  }

  copyPasteItemAbove(from: Category, to: Category): Category {
    const newItem = this.insertItemAbove(to, from.name);
    if (from.children) {
      from.children.forEach((child) => {
        this.copyPasteItem(child, newItem);
      });
    }
    return newItem;
  }

  copyPasteItemBelow(from: Category, to: Category): Category {
    const newItem = this.insertItemBelow(to, from.name);
    if (from.children) {
      from.children.forEach((child) => {
        this.copyPasteItem(child, newItem);
      });
    }
    return newItem;
  }

  deleteNode(nodes: Category[], nodeToDelete: Category) {
    const index = nodes.indexOf(nodeToDelete, 0);
    if (index > -1) {
      nodes.splice(index, 1);
    } else {
      nodes.forEach((node) => {
        if (node.children && node.children.length > 0) {
          this.deleteNode(node.children, nodeToDelete);
        }
      });
    }
  }
}

@Component({
  selector: 'app-root',
  templateUrl: './cdk-tree-nested-example.html',
  styleUrls: ['./cdk-tree-nested-example.css'],
  providers: [ChecklistDatabase],
})
export class CdkTreeNestedExample {
  /** Map from flat node to nested node. This helps us finding the nested node to be modified */
  flatNodeMap = new Map<CategoryFlatNode, Category>();

  /** Map from nested node to flattened node. This helps us to keep the same object for selection */
  nestedNodeMap = new Map<Category, CategoryFlatNode>();

  treeControl: FlatTreeControl<CategoryFlatNode>;

  treeFlattener: MatTreeFlattener<Category, CategoryFlatNode>;

  dataSource: MatTreeFlatDataSource<Category, CategoryFlatNode>;
  /* Drag and drop */
  dragNode: any;
  dragNodeExpandOverWaitTimeMs = 300;
  dragNodeExpandOverNode: any;
  dragNodeExpandOverTime: number;
  dragNodeExpandOverArea: string;
  @ViewChild('emptyItem') emptyItem: ElementRef;

  constructor(private database: ChecklistDatabase) {
    this.treeFlattener = new MatTreeFlattener(
      this.transformer,
      this.getLevel,
      this.isExpandable,
      this.getChildren
    );
    this.treeControl = new FlatTreeControl<CategoryFlatNode>(
      this.getLevel,
      this.isExpandable
    );
    this.dataSource = new MatTreeFlatDataSource(
      this.treeControl,
      this.treeFlattener
    );

    database.dataChange.subscribe((data) => {
      this.dataSource.data = [];
      this.dataSource.data = data;
      this.treeControl.expandAll();
    });
  }

  getLevel = (node: CategoryFlatNode) => node.level;

  isExpandable = (node: CategoryFlatNode) => node.expandable;

  getChildren = (node: Category): Category[] => node.children;

  hasChild = (_: number, _nodeData: CategoryFlatNode) => _nodeData.expandable;

  /**
   * Transformer to convert nested node to flat node. Record the nodes in maps for later use.
   */
  transformer = (node: Category, level: number) => {
    console.log(node, level);
    const existingNode = this.nestedNodeMap.get(node);
    const flatNode =
      existingNode && existingNode.name === node.name
        ? existingNode
        : new CategoryFlatNode();
    flatNode.name = node.name;
    flatNode.level = level;
    flatNode.expandable = node.children && node.children.length > 0;
    flatNode.frontType = node.frontType;
    this.flatNodeMap.set(flatNode, node);
    this.nestedNodeMap.set(node, flatNode);
    return flatNode;
  };

  handleDragStart(event: any, node: any) {
    this.dragNode = node;
    this.treeControl.collapse(node);
  }

  handleDragOver(event: any, node: any) {
    event.preventDefault();

    // Handle node expand
    if (node === this.dragNodeExpandOverNode) {
      if (this.dragNode !== node && !this.treeControl.isExpanded(node)) {
        if (
          new Date().getTime() - this.dragNodeExpandOverTime >
          this.dragNodeExpandOverWaitTimeMs
        ) {
          this.treeControl.expand(node);
        }
      }
    } else {
      this.dragNodeExpandOverNode = node;
      this.dragNodeExpandOverTime = new Date().getTime();
    }

    // Handle drag area
    const percentageY = event.offsetY / event.target.clientHeight;
    if (percentageY < 0.25) {
      this.dragNodeExpandOverArea = 'above';
    } else if (percentageY > 0.75) {
      this.dragNodeExpandOverArea = 'below';
    } else {
      this.dragNodeExpandOverArea = 'center';
    }
  }

  handleDrop(event: any, node: any) {
    event.preventDefault();

    console.log(node, this.dragNodeExpandOverArea);
    if (node !== this.dragNode) {
      let newItem: Category;
      if (this.dragNodeExpandOverArea === 'above') {
        newItem = this.database.copyPasteItemAbove(
          this.flatNodeMap.get(this.dragNode) as any,
          this.flatNodeMap.get(node) as any
        );
      } else if (this.dragNodeExpandOverArea === 'below') {
        newItem = this.database.copyPasteItemBelow(
          this.flatNodeMap.get(this.dragNode) as any,
          this.flatNodeMap.get(node) as any
        );
      } else {
        newItem = this.database.copyPasteItem(
          this.flatNodeMap.get(this.dragNode) as any,
          this.flatNodeMap.get(node) as any
        );
      }
      this.database.deleteItem(this.flatNodeMap.get(this.dragNode) as any);
      this.treeControl.expandDescendants(
        this.nestedNodeMap.get(newItem) as any
      );
    }

    this.dragNode = null;
    this.dragNodeExpandOverNode = null;
    this.dragNodeExpandOverTime = 0;
  }

  handleDragEnd() {
    this.dragNode = null;
    this.dragNodeExpandOverNode = null;
    this.dragNodeExpandOverTime = 0;
  }
}

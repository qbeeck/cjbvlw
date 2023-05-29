import { FlatTreeControl } from '@angular/cdk/tree';
import { Component, Injectable, ElementRef, ViewChild } from '@angular/core';
import {
  MatTreeFlatDataSource,
  MatTreeFlattener,
} from '@angular/material/tree';
import { BehaviorSubject } from 'rxjs';

export class TodoItemNode {
  children: TodoItemNode[];
  item: string;
}

export class TodoItemFlatNode {
  item: string;
  level: number;
  expandable: boolean;
}

/**
 * Checklist database, it can build a tree structured Json object.
 * Each node in Json object represents a to-do item or a category.
 * If a node is a category, it has children items and new items can be added under the category.
 */
@Injectable()
export class ChecklistDatabase {
  dataChange = new BehaviorSubject<TodoItemNode[]>([]);

  get data(): TodoItemNode[] {
    return this.dataChange.value;
  }

  constructor() {
    this.initialize();
  }

  initialize() {
    const data = [
      {
        id: 15461,
        item: 'Sushi | Category',
        order: 1,
        parentId: null,
        frontType: 'category',
        children: [
          {
            id: 15462,
            item: 'Nori | Subcategory',
            order: 1,
            parentId: 15461,
            frontType: 'subCategory',
            children: [
              {
                id: 159863,
                itemCategoryId: 15462,
                item: 'Product #2',
                order: 2,
                parentId: null,
                frontType: 'product',
                children: [
                  {
                    id: 159864,
                    itemCategoryId: null,
                    item: 'Subproduct #4',
                    order: 3,
                    parentId: 159863,
                    frontType: 'subProduct',
                  },
                ],
              },
              {
                id: 159859,
                itemCategoryId: 15462,
                item: 'Product #1',
                order: 1,
                parentId: null,
                frontType: 'product',
                children: [],
              },
            ],
          },
          {
            id: 159861,
            itemCategoryId: 15461,
            item: 'Product #2',
            order: 1,
            parentId: null,
            frontType: 'product',
            children: [
              {
                id: 159862,
                itemCategoryId: null,
                item: 'asdas | Subproduct #1',
                order: 2,
                parentId: 159861,
                frontType: 'subProduct',
              },
            ],
          },
          {
            id: 159860,
            itemCategoryId: 15461,
            item: 'Product #1',
            order: 2,
            parentId: null,
            frontType: 'product',
            children: [],
          },
        ],
      },
    ];

    this.dataChange.next(data as any);
  }

  /** Add an item to to-do list */
  insertItem(parent: TodoItemNode, name: string): TodoItemNode {
    if (!parent.children) {
      parent.children = [];
    }
    const newItem = { item: name } as TodoItemNode;
    parent.children.push(newItem);
    this.dataChange.next(this.data);
    return newItem;
  }

  insertItemAbove(node: TodoItemNode, name: string): TodoItemNode {
    const parentNode = this.getParentFromNodes(node);
    const newItem = { item: name } as TodoItemNode;
    if (parentNode != null) {
      parentNode.children.splice(parentNode.children.indexOf(node), 0, newItem);
    } else {
      this.data.splice(this.data.indexOf(node), 0, newItem);
    }
    this.dataChange.next(this.data);
    return newItem;
  }

  insertItemBelow(node: TodoItemNode, name: string): TodoItemNode {
    const parentNode = this.getParentFromNodes(node);
    const newItem = { item: name } as TodoItemNode;
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

  getParentFromNodes(node: TodoItemNode): TodoItemNode | null {
    for (let i = 0; i < this.data.length; ++i) {
      const currentRoot = this.data[i];
      const parent = this.getParent(currentRoot, node);
      if (parent != null) {
        return parent;
      }
    }
    return null;
  }

  getParent(
    currentRoot: TodoItemNode,
    node: TodoItemNode
  ): TodoItemNode | null {
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

  deleteItem(node: TodoItemNode) {
    this.deleteNode(this.data, node);
    this.dataChange.next(this.data);
  }

  copyPasteItem(from: TodoItemNode, to: TodoItemNode): TodoItemNode {
    const newItem = this.insertItem(to, from.item);
    if (from.children) {
      from.children.forEach((child) => {
        this.copyPasteItem(child, newItem);
      });
    }
    return newItem;
  }

  copyPasteItemAbove(from: TodoItemNode, to: TodoItemNode): TodoItemNode {
    const newItem = this.insertItemAbove(to, from.item);
    if (from.children) {
      from.children.forEach((child) => {
        this.copyPasteItem(child, newItem);
      });
    }
    return newItem;
  }

  copyPasteItemBelow(from: TodoItemNode, to: TodoItemNode): TodoItemNode {
    const newItem = this.insertItemBelow(to, from.item);
    if (from.children) {
      from.children.forEach((child) => {
        this.copyPasteItem(child, newItem);
      });
    }
    return newItem;
  }

  deleteNode(nodes: TodoItemNode[], nodeToDelete: TodoItemNode) {
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
  flatNodeMap = new Map<TodoItemFlatNode, TodoItemNode>();

  /** Map from nested node to flattened node. This helps us to keep the same object for selection */
  nestedNodeMap = new Map<TodoItemNode, TodoItemFlatNode>();

  treeControl: FlatTreeControl<TodoItemFlatNode>;

  treeFlattener: MatTreeFlattener<TodoItemNode, TodoItemFlatNode>;

  dataSource: MatTreeFlatDataSource<TodoItemNode, TodoItemFlatNode>;
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
    this.treeControl = new FlatTreeControl<TodoItemFlatNode>(
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

  getLevel = (node: TodoItemFlatNode) => node.level;

  isExpandable = (node: TodoItemFlatNode) => node.expandable;

  getChildren = (node: TodoItemNode): TodoItemNode[] => node.children;

  hasChild = (_: number, _nodeData: TodoItemFlatNode) => _nodeData.expandable;

  /**
   * Transformer to convert nested node to flat node. Record the nodes in maps for later use.
   */
  transformer = (node: TodoItemNode, level: number) => {
    const existingNode = this.nestedNodeMap.get(node);
    const flatNode =
      existingNode && existingNode.item === node.item
        ? existingNode
        : new TodoItemFlatNode();
    flatNode.item = node.item;
    flatNode.level = level;
    flatNode.expandable = node.children && node.children.length > 0;
    (flatNode as any).frontType = (node as any).frontType;
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
      let newItem: TodoItemNode;
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

import { FlatTreeControl } from '@angular/cdk/tree';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import {
  MatTreeFlatDataSource,
  MatTreeFlattener,
} from '@angular/material/tree';
import { BehaviorSubject } from 'rxjs';

import { TreeItem, TreeItemFlatNode } from './interfaces';

@Component({
  selector: 'app-tree',
  templateUrl: './cdk-tree-nested-example.html',
  styleUrls: ['./cdk-tree-nested-example.css'],
})
export class CdkTreeNestedExample {
  @Input() catalog: TreeItem[];

  @Output() readonly catalogChanges = new EventEmitter<TreeItem[]>();

  private readonly flatNodeMap = new Map<TreeItemFlatNode, TreeItem>();

  private readonly nestedNodeMap = new Map<TreeItem, TreeItemFlatNode>();
  private readonly dataChange = new BehaviorSubject<TreeItem[]>([]);

  protected treeControl = new FlatTreeControl<TreeItemFlatNode>(
    (node) => node.level,
    (node) => node.expandable
  );

  protected treeFlattener = new MatTreeFlattener<TreeItem, TreeItemFlatNode>(
    (node, level) => {
      const existingNode = this.nestedNodeMap.get(node);

      const flatNode =
        existingNode && existingNode.name === node.name
          ? existingNode
          : new TreeItemFlatNode();
      flatNode.name = node.name;
      flatNode.level = level;
      flatNode.expandable = node.children && node.children.length > 0;
      flatNode.frontType = node.frontType;

      this.flatNodeMap.set(flatNode, node);
      this.nestedNodeMap.set(node, flatNode);

      return flatNode;
    },
    (node) => node.level,
    (node) => node.expandable,
    (node) => node.children
  );

  protected dataSource = new MatTreeFlatDataSource(
    this.treeControl,
    this.treeFlattener
  );
  /* Drag and drop */
  protected dragNode: any;
  protected dragNodeExpandOverWaitTimeMs = 300;
  protected dragNodeExpandOverNode: any;
  protected dragNodeExpandOverTime: number;
  protected dragNodeExpandOverArea: string;

  ngOnInit(): void {
    this.dataChange.next(this.catalog);

    this.dataChange.subscribe((data) => {
      this.dataSource.data = data;

      this.treeControl.expandAll();
    });
  }

  protected hasChild = (_: number, _nodeData: TreeItemFlatNode) =>
    _nodeData.expandable;

  protected handleDragStart(event: any, node: any) {
    this.dragNode = node;
    this.treeControl.collapse(node);
  }

  protected handleDragOver(event: any, node: any) {
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

  protected handleDrop(event: any, node: any) {
    event.preventDefault();

    console.log(node, this.dragNodeExpandOverArea);
    if (node !== this.dragNode) {
      let newItem: TreeItem;
      if (this.dragNodeExpandOverArea === 'above') {
        newItem = this.copyPasteItemAbove(
          this.flatNodeMap.get(this.dragNode) as any,
          this.flatNodeMap.get(node) as any
        );
      } else if (this.dragNodeExpandOverArea === 'below') {
        newItem = this.copyPasteItemBelow(
          this.flatNodeMap.get(this.dragNode) as any,
          this.flatNodeMap.get(node) as any
        );
      } else {
        newItem = this.copyPasteItem(
          this.flatNodeMap.get(this.dragNode) as any,
          this.flatNodeMap.get(node) as any
        );
      }
      this.deleteItem(this.flatNodeMap.get(this.dragNode) as any);
      this.treeControl.expandDescendants(
        this.nestedNodeMap.get(newItem) as any
      );
    }

    this.dragNode = null;
    this.dragNodeExpandOverNode = null;
    this.dragNodeExpandOverTime = 0;
  }

  protected handleDragEnd() {
    this.dragNode = null;
    this.dragNodeExpandOverNode = null;
    this.dragNodeExpandOverTime = 0;
  }

  private get data(): TreeItem[] {
    return this.dataChange.value;
  }

  private insertItem(parent: TreeItem, name: string): TreeItem {
    if (!parent.children) {
      parent.children = [];
    }
    const newItem = { name } as TreeItem;
    parent.children.push(newItem);
    this.dataChange.next(this.data);
    return newItem;
  }

  private insertItemAbove(node: TreeItem, name: string): TreeItem {
    const parentNode = this.getParentFromNodes(node);
    const newItem = { name } as TreeItem;
    if (parentNode != null) {
      parentNode.children.splice(parentNode.children.indexOf(node), 0, newItem);
    } else {
      this.data.splice(this.data.indexOf(node), 0, newItem);
    }
    this.dataChange.next(this.data);
    return newItem;
  }

  private insertItemBelow(node: TreeItem, name: string): TreeItem {
    const parentNode = this.getParentFromNodes(node);
    const newItem = { name } as TreeItem;
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

  private getParentFromNodes(node: TreeItem): TreeItem | null {
    for (let i = 0; i < this.data.length; ++i) {
      const currentRoot = this.data[i];
      const parent = this.getParent(currentRoot, node);
      if (parent != null) {
        return parent;
      }
    }
    return null;
  }

  private getParent(currentRoot: TreeItem, node: TreeItem): TreeItem | null {
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

  private deleteItem(node: TreeItem) {
    this.deleteNode(this.data, node);
    this.dataChange.next(this.data);
  }

  private copyPasteItem(from: TreeItem, to: TreeItem): TreeItem {
    const newItem = this.insertItem(to, from.name);
    if (from.children) {
      from.children.forEach((child) => {
        this.copyPasteItem(child, newItem);
      });
    }
    return newItem;
  }

  private copyPasteItemAbove(from: TreeItem, to: TreeItem): TreeItem {
    const newItem = this.insertItemAbove(to, from.name);
    if (from.children) {
      from.children.forEach((child) => {
        this.copyPasteItem(child, newItem);
      });
    }
    return newItem;
  }

  private copyPasteItemBelow(from: TreeItem, to: TreeItem): TreeItem {
    const newItem = this.insertItemBelow(to, from.name);
    if (from.children) {
      from.children.forEach((child) => {
        this.copyPasteItem(child, newItem);
      });
    }
    return newItem;
  }

  private deleteNode(nodes: TreeItem[], nodeToDelete: TreeItem) {
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

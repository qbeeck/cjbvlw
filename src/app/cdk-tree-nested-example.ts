import { FlatTreeControl } from '@angular/cdk/tree';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import {
  MatTreeFlatDataSource,
  MatTreeFlattener,
} from '@angular/material/tree';
import { BehaviorSubject, Subject, takeUntil } from 'rxjs';

import { TreeItem, TreeItemFlatNode } from './interfaces';

type DragNodePosition = 'above' | 'below' | 'center';

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
  protected dragNode: TreeItemFlatNode | null = null;
  protected readonly dragNodeExpandOverWaitTimeMs = 300;
  protected dragNodeExpandOverNode: TreeItemFlatNode | null;
  protected dragNodeExpandOverTime: number;
  protected dragNodeExpandOverArea: DragNodePosition;

  protected readonly treeControl = new FlatTreeControl<TreeItemFlatNode>(
    (node) => node.level,
    (node) => node.expandable
  );
  protected readonly treeFlattener = new MatTreeFlattener<
    TreeItem,
    TreeItemFlatNode
  >(
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

  protected readonly dataSource = new MatTreeFlatDataSource(
    this.treeControl,
    this.treeFlattener
  );

  protected readonly hasChild = (_: number, node: TreeItemFlatNode) =>
    node.expandable;

  private readonly _destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.dataChange.next(this.catalog);

    this.dataChange.pipe(takeUntil(this._destroy$)).subscribe((data) => {
      this.dataSource.data = [];
      this.dataSource.data = data;

      this.treeControl.expandAll();
    });
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }

  protected handleDragStart(node: TreeItemFlatNode) {
    this.dragNode = node;
    this.treeControl.collapse(node);
  }

  protected handleDragOver(event: DragEvent, node: TreeItemFlatNode) {
    event.preventDefault();

    if (node === this.dragNodeExpandOverNode) {
      if (this.dragNode !== node && !this.treeControl.isExpanded(node)) {
        const currentTime = new Date().getTime();

        if (
          currentTime - this.dragNodeExpandOverTime >
          this.dragNodeExpandOverWaitTimeMs
        ) {
          this.treeControl.expand(node);
        }
      }
    } else {
      this.dragNodeExpandOverNode = node;
      this.dragNodeExpandOverTime = new Date().getTime();
    }

    const target = event.target as HTMLInputElement;
    const clientHeight = target.clientHeight;
    const offsetY = event.offsetY;
    const percentageY = offsetY / clientHeight;

    switch (true) {
      case percentageY < 0.25:
        this.dragNodeExpandOverArea = 'above';
        break;
      case percentageY > 0.75:
        this.dragNodeExpandOverArea = 'below';
        break;
      default:
        this.dragNodeExpandOverArea = 'center';
        break;
    }
  }

  protected handleDrop(event: DragEvent, node: TreeItemFlatNode) {
    event.preventDefault();

    if (this.dragNode && node !== this.dragNode) {
      let newItem: TreeItem;

      const from = this.flatNodeMap.get(this.dragNode) as TreeItem;
      const to = this.flatNodeMap.get(node) as TreeItem;

      switch (this.dragNodeExpandOverArea) {
        case 'above':
          newItem = this.copyPasteItemByPosition(from, to, 'above');
          break;
        case 'below':
          newItem = this.copyPasteItemByPosition(from, to, 'below');
          break;
        default:
          newItem = this.copyPasteItemByPosition(from, to, 'center');
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

      if (parent != null) return parent;
    }

    return null;
  }

  private getParent(currentRoot: TreeItem, node: TreeItem): TreeItem | null {
    const currentRootChildren = currentRoot.children;

    if (currentRootChildren && currentRootChildren.length > 0) {
      for (let i = 0; i < currentRootChildren.length; ++i) {
        const children = currentRootChildren[i];

        if (children === node) return currentRoot;

        if (children.children && children.children.length > 0) {
          const parent = this.getParent(children, node);

          if (parent !== null) return parent;
        }
      }
    }

    return null;
  }

  private deleteItem(node: TreeItem) {
    this.deleteNode(this.data, node);
    this.dataChange.next(this.data);
  }

  private copyPasteItemByPosition(
    from: TreeItem,
    to: TreeItem,
    position: DragNodePosition
  ): TreeItem {
    let newItem: TreeItem;

    switch (position) {
      case 'above':
        newItem = this.insertItemAbove(to, from.name);
        break;
      case 'below':
        newItem = this.insertItemBelow(to, from.name);
        break;
      default:
        newItem = this.insertItem(to, from.name);
    }

    if (from.children) {
      from.children.forEach((child) => {
        this.copyPasteItemByPosition(child, newItem, 'center');
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

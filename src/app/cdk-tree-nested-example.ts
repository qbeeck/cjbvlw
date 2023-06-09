import { FlatTreeControl } from '@angular/cdk/tree';
import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  Output,
  TrackByFunction,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import {
  MatTreeFlatDataSource,
  MatTreeFlattener,
  MatTreeModule,
} from '@angular/material/tree';
import { BehaviorSubject, Subject, takeUntil } from 'rxjs';

import { TreeItem, TreeItemFlatNode } from './interfaces';

type DragNodePosition = 'above' | 'below' | 'center';

@Component({
  selector: 'app-tree',
  standalone: true,
  imports: [MatTreeModule, MatIconModule, MatButtonModule, CommonModule],
  templateUrl: './cdk-tree-nested-example.html',
  styleUrls: ['./cdk-tree-nested-example.css'],
})
export class CdkTreeNestedExample {
  @Input() catalog: TreeItem[];

  @Output() readonly catalogChanges = new EventEmitter<TreeItem[]>();

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
      flatNode.id = node.id;
      flatNode.name = node.name;
      flatNode.level = level;
      flatNode.expandable = node.children && node.children.length > 0;
      flatNode.frontType = node.frontType;
      flatNode.order = node.order;

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
  protected dragNodeExpandOverNode: TreeItemFlatNode | null;
  protected dragNodeExpandOverArea: DragNodePosition;
  protected readonly hasChild = (_: number, node: TreeItemFlatNode) =>
    node.expandable;

  private readonly flatNodeMap = new Map<TreeItemFlatNode, TreeItem>();
  private readonly nestedNodeMap = new Map<TreeItem, TreeItemFlatNode>();
  private readonly dataChange = new BehaviorSubject<TreeItem[]>([]);
  private dragNode: TreeItemFlatNode | null = null;
  private readonly dragNodeExpandOverWaitTimeMs = 500;
  private dragNodeExpandOverTime: number;

  private readonly _destroy$ = new Subject<void>();

  protected readonly trackBy: TrackByFunction<TreeItemFlatNode> = (_, item) =>
    item.id;

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

    // subproduct -> product = subproduct
    // product -> product = subproduct

    // category -> product = not allow
    // category -> subProduct = not allow
    // product -> subProduct = not allow

    // проверка на то, что переносимая нода не является той же самой, куда хотят перенсти ноду
    if (this.dragNode && node !== this.dragNode) {
      const nodeFrontType = node.frontType;
      const dragNodeFrontType = this.dragNode.frontType;

      if (
        this.dragNodeExpandOverArea === 'above' &&
        nodeFrontType === dragNodeFrontType
      ) {
      }
    }

    console.log(this.dragNode, node);

    if (this.dragNode && node !== this.dragNode) {
      let newItem: TreeItem;

      const from = this.flatNodeMap.get(this.dragNode) as TreeItem;
      const to = this.flatNodeMap.get(node) as TreeItem;

      switch (this.dragNodeExpandOverArea) {
        case 'above':
          newItem = this.copyPasteItem(from, to, 'above');
          break;
        case 'below':
          newItem = this.copyPasteItem(from, to, 'below');
          break;
        default:
          newItem = this.copyPasteItem(from, to, 'center');
      }

      this.deleteItem(this.flatNodeMap.get(this.dragNode) as TreeItem);

      const newItemFlatNode = this.nestedNodeMap.get(newItem);

      if (newItemFlatNode) {
        this.treeControl.expandDescendants(newItemFlatNode);
      }

      this.catalogChanges.emit(this.data);
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

  private insertItem(parent: TreeItem, from: TreeItem): TreeItem {
    if (!parent.children) {
      parent.children = [];
    }

    const newItem: TreeItem = { ...from, children: [] };
    parent.children.push(newItem);

    this.dataChange.next(this.data);
    return newItem;
  }

  private insertItemAbove(node: TreeItem, from: TreeItem): TreeItem {
    const parentNode = this.getParentFromNodes(node);
    const newItem: TreeItem = { ...from, children: [] };

    if (parentNode != null) {
      parentNode.children.splice(parentNode.children.indexOf(node), 0, newItem);
    } else {
      this.data.splice(this.data.indexOf(node), 0, newItem);
    }

    this.dataChange.next(this.data);
    return newItem;
  }

  private insertItemBelow(node: TreeItem, from: TreeItem): TreeItem {
    const parentNode = this.getParentFromNodes(node);
    const newItem: TreeItem = { ...from, children: [] };

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
    for (const currentRoot of this.data) {
      const parent = this.getParent(currentRoot, node);

      if (parent != null) return parent;
    }

    return null;
  }

  private getParent(currentRoot: TreeItem, node: TreeItem): TreeItem | null {
    const currentRootChildren = currentRoot.children;

    if (currentRootChildren && currentRootChildren.length > 0) {
      for (const children of currentRootChildren) {
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

  private copyPasteItem(
    from: TreeItem,
    to: TreeItem,
    position: DragNodePosition
  ): TreeItem {
    let newItem: TreeItem;

    switch (position) {
      case 'above':
        newItem = this.insertItemAbove(to, from);
        break;
      case 'below':
        newItem = this.insertItemBelow(to, from);
        break;
      default:
        newItem = this.insertItem(to, from);
    }

    if (from.children) {
      from.children.forEach((child) => {
        this.copyPasteItem(child, newItem, 'center');
      });
    }

    return newItem;
  }

  private deleteNode(nodes: TreeItem[], nodeToDelete: TreeItem) {
    const index = nodes.indexOf(nodeToDelete);

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

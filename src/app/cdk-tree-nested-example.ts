import { ArrayDataSource } from '@angular/cdk/collections';
import { Component } from '@angular/core';
import { NestedTreeControl } from '@angular/cdk/tree';

interface Category {
  id: number;
  name: string;
  order: number;
  parentId: number | null;
  childrenItemCategories: ItemCategory[];
  items: Item[];
}

interface ItemCategory {
  id: number;
  name: string;
  order: number;
  parentId: number | null;
  items: Item[];
}

interface Item {
  id: number;
  itemCategoryId: number | null;
  parentId: number | null;
  name: string;
  order: number;
  children?: Item[];
}

const category: Category = {
  id: 15461,
  name: 'Sushi | Category',
  order: 1,
  parentId: null,
  childrenItemCategories: [
    {
      id: 15462,
      name: 'Nori | Subcategory',
      order: 1,
      parentId: 15461,
      items: [
        {
          id: 159863,
          itemCategoryId: 15462,
          parentId: null,
          name: 'Product #2',
          order: 2,
          children: [
            {
              id: 159864,
              itemCategoryId: null,
              parentId: 159863,
              name: 'Subproduct #4',
              order: 3,
            },
          ],
        },
        {
          id: 159859,
          itemCategoryId: 15462,
          parentId: null,
          name: 'Product #1',
          order: 1,
          children: [],
        },
      ],
    },
  ],
  items: [
    {
      id: 159861,
      itemCategoryId: 15461,
      parentId: null,
      name: 'Product #2',
      order: 1,
      children: [
        {
          id: 159862,
          itemCategoryId: null,
          parentId: 159861,
          name: 'asdas | Subproduct #1',
          order: 2,
        },
      ],
    },
    {
      id: 159860,
      itemCategoryId: 15461,
      parentId: null,
      name: 'Product #1',
      order: 2,
      children: [],
    },
  ],
};

const subProductMapper = (subProduct: Item) => {
  const { id, itemCategoryId, name, order, parentId } = subProduct;

  return {
    id,
    itemCategoryId,
    name,
    order,
    parentId,
    frontType: 'subProduct',
  };
};

const productMapper = (product: Item) => {
  const { id, itemCategoryId, name, order, parentId, children } = product;

  return {
    id,
    itemCategoryId,
    name,
    order,
    parentId,
    frontType: 'product',
    ...(!!children && {
      children: children.map((child) => subProductMapper(child)),
    }),
  };
};

const subCategoryMapper = (subCategory: ItemCategory) => {
  const { id, name, order, parentId, items } = subCategory;

  return {
    id,
    name,
    order,
    parentId,
    frontType: 'subCategory',
    children: items.map((item) => productMapper(item)),
  };
};

const categroyMapper = (category: Category) => {
  const { id, name, order, parentId, childrenItemCategories, items } = category;

  return {
    id,
    name,
    order,
    parentId,
    frontType: 'category',
    children: [
      ...childrenItemCategories.map((item) => subCategoryMapper(item)),
      ...items.map((item) => productMapper(item)),
    ],
  };
};

@Component({
  selector: 'cdk-tree-nested-example',
  templateUrl: 'cdk-tree-nested-example.html',
  styleUrls: ['cdk-tree-nested-example.css'],
})
export class CdkTreeNestedExample {
  treeControl = new NestedTreeControl<any>((node) => node.children);
  dataSource = new ArrayDataSource([categroyMapper(category)]);
  hasChild = (_: number, node: any) =>
    !!node.children && node.children.length > 0;

  catalog = [category];
}

import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  template: `<app-tree [catalog]="catalog"></app-tree>`,
})
export class AppComponent {
  catalog = [
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
}

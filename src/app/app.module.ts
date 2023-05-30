import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { CdkTreeNestedExample } from './cdk-tree-nested-example';
import { AppComponent } from './app.component';

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserAnimationsModule, BrowserModule, CdkTreeNestedExample],
  bootstrap: [AppComponent],
})
export class AppModule {}

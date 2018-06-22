import {bindable, bindingMode} from 'aurelia-framework';
import { Action } from './action';

export class UpskillingDropdown {
    @bindable items: Action[];
    @bindable({ defaultBindingMode: bindingMode.twoWay }) selected: Action;

    constructor(items) {
        this.items = items;
    }

    getDropdownLabel() {
        return this.selected || 'Select action';
    }

    selectItem(item) {
        this.selected = item;
    }

    emptySelectedElement() {
        this.selected = undefined;
    }
}
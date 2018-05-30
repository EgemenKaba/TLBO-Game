import {bindable, bindingMode} from 'aurelia-framework';
import { Individual } from 'individual';

export class TeacherDropdown {
    @bindable items: Individual[];
    @bindable({ defaultBindingMode: bindingMode.twoWay }) selectedItem: Individual;

    constructor(items) {
        this.items = items;
    }

    getDropdownLabel() {
        return this.selectedItem || 'Select teacher';
    }

    selectItem(item) {
        this.selectedItem = item;
    }

    emptySelectedElement() {
        this.selectedItem = undefined;
    }
}
import {bindable, bindingMode} from 'aurelia-framework';

export class TeacherDropdown {
    @bindable items: string[];
    @bindable({ defaultBindingMode: bindingMode.twoWay }) selectedItem: string;

    constructor(items) {
        this.items = items;
    }

    getDropdownLabel() {
        return this.selectedItem || 'Select teacher';
    }

    selectItem(item) {
        this.selectedItem = item;
    }
}
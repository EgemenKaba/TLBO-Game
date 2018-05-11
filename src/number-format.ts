export class NumberFormatValueConverter {
  toView(value) {
    return value && value.toFixed(3);
  }
}
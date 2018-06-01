export class NumberFormatValueConverter {
  toView(value) {
    return value && Math.round(value);
  }
}
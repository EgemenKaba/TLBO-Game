export class NumberFormatValueConverter {
  toView(value) {
    return value && Math.trunc(value);
  }
}
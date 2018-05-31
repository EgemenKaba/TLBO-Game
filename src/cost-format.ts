export class CostFormatValueConverter {
  toView(value) {
    return value && value.toFixed(2);
  }
}
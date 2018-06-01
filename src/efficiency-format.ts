export class EfficiencyFormatValueConverter {
  toView(value, algorithm) {
    if ('rastrigin' === algorithm) {
      return (100 - (value - 8.82483201160156) / (93.24081268239809 - 8.82483201160156) * 100).toFixed(2);
    } else if ('linear' === algorithm) {
      return (100 - (value - 0) / (409.59999999999997 - 0) * 100).toFixed(2);
    }
  }
}
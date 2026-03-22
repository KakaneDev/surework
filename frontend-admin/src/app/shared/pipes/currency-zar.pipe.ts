import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'currencyZar',
  standalone: true
})
export class CurrencyZarPipe implements PipeTransform {
  transform(value: number | null | undefined, showSymbol = true, decimals = 2): string {
    if (value === null || value === undefined) {
      return showSymbol ? 'R0.00' : '0.00';
    }

    const formatted = value.toLocaleString('en-ZA', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });

    return showSymbol ? `R${formatted}` : formatted;
  }
}

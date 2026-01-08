export function formatFinancialValue(value: number, type: 'price' | 'rsi' = 'price'): string {
    if (type === 'rsi') {
        return value.toFixed(2);
    }

    if (Math.abs(value) >= 1) {
        return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    // For small values (< 1), show more precision
    return value.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 6 });
}

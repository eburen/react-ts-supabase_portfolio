/**
 * Format a number as a currency string with the given locale and currency
 * @param value Number to format as currency
 * @param locale Locale to use for formatting
 * @param currency Currency code to use
 * @returns Formatted currency string
 */
export const formatCurrency = (
    value: number,
    locale: string = 'en-US',
    currency: string = 'USD'
): string => {
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
    }).format(value);
};

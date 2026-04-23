export const calculateMarginInUSD = (symbol, symbolData, ask, lots, leverage, allMarketData) => {
    if (!symbolData || isNaN(parseFloat(ask)) || isNaN(parseFloat(lots)) || !leverage) return 0;
    
    const buyPrice = parseFloat(ask);
    const contractValue = symbolData.contractSize * parseFloat(lots);
    let marginInBaseCurrency = (contractValue * buyPrice) / leverage;
    
    // If mode is not standard, apply marginPct multiplier (from existing logic)
    if (symbolData.marginCalcMode !== 'standard' && symbolData.marginPct !== undefined) {
        marginInBaseCurrency = marginInBaseCurrency * symbolData.marginPct;
    }

    let marginInUSD = marginInBaseCurrency;

    const marketDataCache = new Map();
    if (allMarketData && Array.isArray(allMarketData)) {
        allMarketData.forEach(m => marketDataCache.set(m.symbol, m));
    }

    const getUSDConversionRate = (currency) => {
        // Direct pair (e.g. EURUSD)
        const directPair = marketDataCache.get(`${currency}USD`);
        if (directPair && directPair.bid) return parseFloat(directPair.bid);

        // Indirect pair (e.g. USDJPY)
        const indirectPair = marketDataCache.get(`USD${currency}`);
        if (indirectPair && indirectPair.bid) return 1 / parseFloat(indirectPair.bid);

        return null;
    };

    try {
        const typeStr = symbolData.instrumentType ? symbolData.instrumentType.toString() : symbolData.type ? symbolData.type.toString() : "";

        // Normalize type matching
        const type = typeStr.toLowerCase();

        if (type === "1" || type === "forex") {
            const quoteCurrency = symbol.slice(-3);
            if (quoteCurrency !== 'USD') {
                const usdRate = getUSDConversionRate(quoteCurrency);
                if (usdRate) {
                    marginInUSD = marginInBaseCurrency * usdRate;
                }
            }
        } else if (type === "2" || type === "commodities" || type === "commodity") {
            if (symbol.startsWith('XAU')) { // Gold
                const goldData = marketDataCache.get('XAUUSD');
                if (goldData && goldData.ask) {
                    marginInUSD = (contractValue * parseFloat(goldData.ask)) / leverage;
                }
            } else if (symbol.startsWith('XAG')) { // Silver
                const silverData = marketDataCache.get('XAGUSD');
                if (silverData && silverData.ask) {
                    marginInUSD = (contractValue * parseFloat(silverData.ask)) / leverage;
                }
            } else {
                marginInUSD = (contractValue * buyPrice) / leverage;
            }
        } else if (type === "3" || type === "indices" || type === "index") {
            const indexCurrencyMap = {
                'JPN225': { currency: 'JPY', direct: false },
                'GER40': { currency: 'EUR', direct: true },
                'US30': { currency: 'USD', direct: true },
                'UK100': { currency: 'GBP', direct: true },
                'AUS200': { currency: 'AUD', direct: true },
                'ESP35': { currency: 'EUR', direct: true },
                'FRA40': { currency: 'EUR', direct: true },
                'HK50': { currency: 'HKD', direct: false },
                'NAS100': { currency: 'USD', direct: true },
                'SPX500': { currency: 'USD', direct: true }
            };

            const indexConfigEntry = Object.entries(indexCurrencyMap)
                .find(([prefix]) => symbol.includes(prefix));

            if (indexConfigEntry) {
                const config = indexConfigEntry[1];

                if (config.currency === 'USD') {
                    marginInUSD = marginInBaseCurrency;
                } else {
                    let conversionRate;
                    if (config.direct) {
                        const usdPair = `${config.currency}USD`;
                        const pairData = marketDataCache.get(usdPair);
                        if (pairData && pairData.bid) {
                            conversionRate = parseFloat(pairData.bid);
                        }
                    } else {
                        const usdPair = `USD${config.currency}`;
                        const pairData = marketDataCache.get(usdPair);
                        if (pairData && pairData.bid) {
                            conversionRate = 1 / parseFloat(pairData.bid);
                        }
                    }

                    if (conversionRate) {
                        marginInUSD = marginInBaseCurrency * conversionRate;
                    }
                }
            }
        } else if (type === "4" || type === "crypto") {
            const marginValue = symbolData.margin !== undefined ? symbolData.margin : (symbolData.marginPct || 1);

            if (symbol.endsWith('USD') || symbol.endsWith('USDT')) {
                marginInUSD = (contractValue * buyPrice * marginValue) / leverage;
            } else {
                const cryptoCurrency = symbol.slice(-3);
                const usdRate = getUSDConversionRate(cryptoCurrency);
                if (usdRate) {
                    marginInUSD = (contractValue * buyPrice * marginValue) / leverage;
                } else {
                    // Fallback to direct calculation if no conversion found
                    marginInUSD = (contractValue * buyPrice * marginValue) / leverage;
                }
            }
        }

        return isNaN(marginInUSD) ? 0 : marginInUSD;
    } catch (error) {
        console.error('Error calculating margin:', error);
        return 0;
    }
};

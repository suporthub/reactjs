const normalizeSymbol = (s) => {
    if (!s) return "";
    // Remove common suffixes like .pro, .m, +, etc. 
    // Usually anything after the first 6 chars in forex or first 3-4 in others
    return s.split('.')[0].replace('+', '');
};

export const calculateMarginInUSD = (symbol, symbolData, ask, lots, leverage, allMarketData) => {
    if (!symbolData || isNaN(parseFloat(ask)) || isNaN(parseFloat(lots)) || !leverage) return 0;
    
    const buyPrice = parseFloat(ask);
    const contractValue = symbolData.contractSize * parseFloat(lots);
    
    // Base margin calculation (in Quote currency for Forex, or direct for others)
    let marginVal = (contractValue * buyPrice) / leverage;
    
    // Apply margin percentage multiplier if applicable
    if (symbolData.marginCalcMode !== 'standard' && symbolData.marginPct !== undefined) {
        marginVal = marginVal * symbolData.marginPct;
    }

    let marginInUSD = marginVal;

    const marketDataCache = new Map();
    if (allMarketData && Array.isArray(allMarketData)) {
        allMarketData.forEach(m => {
            marketDataCache.set(normalizeSymbol(m.symbol), m);
        });
    }

    const getUSDConversionRate = (currency) => {
        if (!currency || currency === 'USD') return 1;

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
        const type = typeStr.toLowerCase();
        const baseSymbol = normalizeSymbol(symbol);

        if (type === "1" || type === "forex") {
            // For forex, the quote currency is usually the last 3 chars of the base 6-char pair
            const quoteCurrency = baseSymbol.length >= 6 ? baseSymbol.substring(3, 6) : baseSymbol.slice(-3);
            
            if (quoteCurrency !== 'USD') {
                const usdRate = getUSDConversionRate(quoteCurrency);
                if (usdRate) {
                    marginInUSD = marginVal * usdRate;
                }
            }
        } else if (type === "2" || type === "commodities" || type === "commodity") {
            if (baseSymbol.startsWith('XAU')) { // Gold
                const goldData = marketDataCache.get('XAUUSD');
                const price = (goldData && goldData.ask) ? parseFloat(goldData.ask) : buyPrice;
                marginInUSD = (contractValue * price) / leverage;
            } else if (baseSymbol.startsWith('XAG')) { // Silver
                const silverData = marketDataCache.get('XAGUSD');
                const price = (silverData && silverData.ask) ? parseFloat(silverData.ask) : buyPrice;
                marginInUSD = (contractValue * price) / leverage;
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
                .find(([prefix]) => baseSymbol.includes(prefix));

            if (indexConfigEntry) {
                const config = indexConfigEntry[1];
                const usdRate = getUSDConversionRate(config.currency);
                if (usdRate) {
                    marginInUSD = marginVal * usdRate;
                }
            }
        } else if (type === "4" || type === "crypto") {
            const marginMultiplier = symbolData.margin !== undefined ? symbolData.margin : (symbolData.marginPct || 1);
            marginInUSD = (contractValue * buyPrice * marginMultiplier) / leverage;
        }

        // Final safety check against negative or weird values
        return Math.abs(isNaN(marginInUSD) ? 0 : marginInUSD);
    } catch (error) {
        console.error('Error calculating margin:', error);
        return 0;
    }
};
